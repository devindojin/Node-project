import * as mongoose from 'mongoose'
import { BusinessHoursBlock } from "./types/business-hours-block"
import { DayOfTheWeek } from "./types/enums/day-of-the-week.enum"

const connectToDb = async () => {
	try {
		await mongoose.connect(
			`mongodb://rezrvapp-api:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}:27017/rezrvapp`,
			{
				connectTimeoutMS: 3000
			})
	} catch (err) {
		console.error(`Could not connect to: ${process.env.MONGO_URL}`, err)
		process.exit(1)
	}
}

const removeAllV1Collections = async () => {

	await connectToDb()

	console.info("Removing v1 collections from database")

	try {
		await mongoose.connection.db.dropCollection("bookings")
		await mongoose.connection.db.dropCollection("operators")
		await mongoose.connection.db.dropCollection("product-snapshots")
		await mongoose.connection.db.dropCollection("products")
	} catch (error) {
		console.error("Failed to drop (one or more) collections")
		return
	}

	console.info("Finished removing v1 collections from database")
}

const convertToLocalDate = (timeZone: string) => {
	const bookingStartUtc = new Date(2022, 5, 2, 17, 0, 0)
	console.log('bookingStartUtc:', bookingStartUtc)

	const bookingStartLocal = bookingStartUtc.toLocaleString('en-CA', {
		timeZone,
		weekday: 'long',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	})
	console.log('bookingStartLocal:', bookingStartLocal)
}

const timeZoneOffset = (businessTimeZone: string, forBusiness: boolean) => {

	// calculate offset

	const now = new Date()
	console.log('now:', now)

	const businessTimeDateString = now.toLocaleString('en-CA', {
		timeZone: businessTimeZone,
		hour12: false })
	console.log('businessTimeDateString:', businessTimeDateString)

	const businessDate = new Date(businessTimeDateString.replace(', ', 'T'))
	console.log('businessDate', businessDate)

	const difference = forBusiness ?
		businessDate.getTime() - now.getTime() :
		now.getTime() - businessDate.getTime()
	const offset = Math.round(difference / (1000 * 60))
	console.log('offset:', offset)

	// apply offset to selected booking start

	const selectedDate = new Date(2022, 4, 31, 17, 0, 0)
	console.log('selectedDate in browser local time:', selectedDate)

	selectedDate.setMinutes(selectedDate.getMinutes() + offset)
	console.log('selectedDate in browser local time adjusted by offset', selectedDate)
}

const calculateDifferenceBetweenTimeInt = (startTimeIntA: number, endTimeIntB: number): number => {
	if (endTimeIntB < startTimeIntA) {
		endTimeIntB += 70000
	}

	const greaterTimeInt = startTimeIntA > endTimeIntB ? startTimeIntA : endTimeIntB
	const smallerTimeInt = startTimeIntA > endTimeIntB ? endTimeIntB : startTimeIntA

	const getDays = (time: number): number => {
		return Number(time.toString().padStart(6, '0').substring(0, 2))
	}
	const getHours = (time: number): number => {
		return Number(time.toString().padStart(6, '0').substring(2, 4))
	}
	const getMinutes = (time: number): number => {
		return Number(time.toString().padStart(6, '0').substring(4, 6))
	}

	const greaterTimeDays = getDays(greaterTimeInt)
	const greaterTimeHours = getHours(greaterTimeInt)
	const greaterTimeMinutes = getMinutes(greaterTimeInt)
	const smallerTimeDays = getDays(smallerTimeInt)
	const smallerTimeHours = getHours(smallerTimeInt)
	const smallerTimeMinutes = getMinutes(smallerTimeInt)

	let resultDays = greaterTimeDays - smallerTimeDays
	let resultHours = greaterTimeHours - smallerTimeHours

	const deductHours = (hours: number): void => {
		resultHours = 24 + hours
		resultDays--
	}

	if (resultHours < 0) {
		deductHours(resultHours)
	}

	let resultMinutes = greaterTimeMinutes - smallerTimeMinutes

	if (resultMinutes < 0) {
		resultMinutes = 60 + resultMinutes
		resultHours--

		if (resultHours < 0) {
			deductHours(resultHours)
		}
	}

	const result = Number(`${resultDays}${resultHours.toString().padStart(2, '0')}${resultMinutes.toString().padStart(2, '0')}`)
	console.log(result)
	return result
}

const mergeBusinessHoursBlocks = () => {
	const input = [
		new BusinessHoursBlock(
			// DayOfTheWeek.Monday, 8, 0, DayOfTheWeek.Monday, 17, 30
			// DayOfTheWeek.Wednesday, 2, 0, DayOfTheWeek.Monday, 17, 30
			DayOfTheWeek.Monday, 22, 0, DayOfTheWeek.Tuesday, 0, 0
		),
		new BusinessHoursBlock(
			// DayOfTheWeek.Tuesday, 8, 0, DayOfTheWeek.Wednesday, 0, 0
			// DayOfTheWeek.Tuesday, 8, 0, DayOfTheWeek.Tuesday, 23, 0
			DayOfTheWeek.Tuesday, 0, 0, DayOfTheWeek.Tuesday, 2, 0
		),
		new BusinessHoursBlock(
			// DayOfTheWeek.Wednesday, 0, 0, DayOfTheWeek.Thursday, 2, 0
			// DayOfTheWeek.Wednesday, 0, 0, DayOfTheWeek.Wednesday, 2, 0
			DayOfTheWeek.Tuesday, 17, 0, DayOfTheWeek.Monday, 22, 0
		)

		///////////////////////

		// new BusinessHoursBlock(
		// 	DayOfTheWeek.Tuesday, 8, 0, DayOfTheWeek.Wednesday, 0, 0
		// ),
		// new BusinessHoursBlock(
		// 	DayOfTheWeek.Wednesday, 0, 0, DayOfTheWeek.Tuesday, 8, 0
		// )
	]

	const matchingOnEnd = (blockA: BusinessHoursBlock, blockB: BusinessHoursBlock): boolean => {
		return blockA.endDayOfTheWeek == blockB.startDayOfTheWeek &&
			blockA.endHour == blockB.startHour && 
			blockA.endMinute == blockB.startMinute
	}

	const matchingOnStart = (blockA: BusinessHoursBlock, blockB: BusinessHoursBlock): boolean => {
		return blockA.startDayOfTheWeek == blockB.endDayOfTheWeek &&
			blockA.startHour == blockB.endHour && 
			blockA.startMinute == blockB.endMinute
	}

	const alreadyMerged: number[] = []
	const mergedBlocks: BusinessHoursBlock[] = []

	for (let i = 0; i < input.length; i++) {
		if (alreadyMerged.some(ami => ami == i)) {
			continue
		}

		const mergedBlock = new BusinessHoursBlock(input[i].startDayOfTheWeek, input[i].startHour, input[i].startMinute, input[i].endDayOfTheWeek, input[i].endHour, input[i].endMinute)

		let matchingBlockIndex: number
		do {
			matchingBlockIndex = input.findIndex((b, index) => 
				index != i &&
				!alreadyMerged.some(ami => ami == index) &&
				( matchingOnStart(b, mergedBlock) || matchingOnEnd(b, mergedBlock) ))

			if (matchingBlockIndex < 0) {
				break
			}

			if (matchingOnStart(input.at(matchingBlockIndex), mergedBlock)) {
				mergedBlock.endDayOfTheWeek = input.at(matchingBlockIndex).endDayOfTheWeek
				mergedBlock.endHour = input.at(matchingBlockIndex).endHour
				mergedBlock.endMinute = input.at(matchingBlockIndex).endMinute
			} else {
				mergedBlock.startDayOfTheWeek =  input.at(matchingBlockIndex).startDayOfTheWeek
				mergedBlock.startHour = input.at(matchingBlockIndex).startHour
				mergedBlock.startMinute = input.at(matchingBlockIndex).startMinute
			}
			alreadyMerged.push(matchingBlockIndex)
		} while (matchingBlockIndex > -1)
		
		mergedBlocks.push(mergedBlock)
		alreadyMerged.push(i)
	}

	console.log(mergedBlocks)
}

const splitBusinessHoursBlocks = () => {
	const input = [
		new BusinessHoursBlock(
			DayOfTheWeek.Monday, 8, 0, DayOfTheWeek.Wednesday, 17, 0
		),
		new BusinessHoursBlock(
			DayOfTheWeek.Thursday, 8, 0, DayOfTheWeek.Sunday, 0, 0
		),
		//////////////////
		// new BusinessHoursBlock(
		// 	DayOfTheWeek.Monday, 8, 0, DayOfTheWeek.Tuesday, 0, 0
		// )
	]

	const splitBlocks: BusinessHoursBlock[] = []

	const incrementWeekDayInt = (weekday: DayOfTheWeek): number => {
		return weekday + 1 == 7 ? 0 : weekday + 1
	}

	for (const block of input) {
		if (block.startDayOfTheWeek == block.endDayOfTheWeek) {
			splitBlocks.push(block)
			continue
		}

		let currentDay = block.startDayOfTheWeek
		const currentSplitBlocks: BusinessHoursBlock[] = []

		let daysToProcess = block.getStartTimeInteger() > block.getEndTimeInteger() ?
			(block.endDayOfTheWeek + 7) - block.startDayOfTheWeek + 1 :
			block.endDayOfTheWeek - block.startDayOfTheWeek + 1
		if (block.endHour == 0 && block.endMinute == 0) {
			daysToProcess--
		}

		for (let i = 0; i < daysToProcess; i++) {
			const nextDay = incrementWeekDayInt(currentDay)
			if (currentDay == block.startDayOfTheWeek) {
				currentSplitBlocks.push(new BusinessHoursBlock(
					block.startDayOfTheWeek, block.startHour, block.startMinute, nextDay, 0, 0)
				)
			} else if (currentDay == block.endDayOfTheWeek) {
				currentSplitBlocks.push(new BusinessHoursBlock(
					currentSplitBlocks.at(-1).endDayOfTheWeek, 0, 0, block.endDayOfTheWeek, block.endHour, block.endMinute
				))
			} else {
				currentSplitBlocks.push(new BusinessHoursBlock(
					currentSplitBlocks.at(-1).endDayOfTheWeek, 0, 0, nextDay, 0, 0
				))
			}
			currentDay = nextDay
		}

		splitBlocks.push(...currentSplitBlocks)
	}

	console.log(splitBlocks)
}

(async () => {
	// await removeAllV1Collections()

	// convertToLocalDate("America/Santiago")
	// timeZoneOffset("America/Los_Angeles", false)
	// calculateDifferenceBetweenTimeInt(62330, 130)
	// mergeBusinessHoursBlocks()
	// splitBusinessHoursBlocks()
})()