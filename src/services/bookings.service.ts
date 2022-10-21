import { Document } from "mongoose"

import { BookingDbModel, IBooking } from "../db-models/booking.db-model"
import { BadRequestError } from "../errors/bad-request.error"
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { Logger } from "../logger"
import { Booking } from "../types/booking"
import { Business } from "../types/business"
import { BookingStatus } from "../types/enums/booking.status"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { TimeZone } from "../types/enums/time-zone.enum"
import { DateUtils } from "../utils/date.utils"
import { BusinessServiceSnapshotsService } from "./business-service-snapshots.service"
import { BusinessesService } from "./businesses.service"
import { EmailService } from "./email.service"
import { IcsService } from "./ics.service"

export abstract class BookingsService {

	public static async getByIdForBusiness(businessId: string, bookingId: string, hydrate = true): Promise<Booking> {
		const bookingDoc = await BookingsService.getBookingDocByIdForBusiness(bookingId, businessId)

		if (bookingDoc == null) {
			Logger.logger.warn(`Booking ${bookingId} for business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Booking ${bookingId} for business ${businessId} doesn't exist`)
		}

		const booking = BookingDbModel.convertToDomainModel(bookingDoc)
		if (hydrate == true) {
			await BookingsService.hydrateBooking(booking)
		}
		return booking
	}

	public static async getByIdForBusinessAndService(businessId: string, serviceId: string, bookingId: string, hydrate = true): Promise<Booking> {

		const bookingDoc = await BookingsService.getBookingDocByIdForBusinessAndService(bookingId, businessId, serviceId)

		if (bookingDoc == null) {
			Logger.logger.warn(`Booking ${bookingId} for business ${businessId} and service ${serviceId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Booking ${bookingId} for business ${businessId} and service ${serviceId} doesn't exist`)
		}

		const booking = BookingDbModel.convertToDomainModel(bookingDoc)
		if (hydrate == true) {
			await BookingsService.hydrateBooking(booking)
		}
		return booking
	}

	public static async getForBusiness(businessId: string, status: BookingStatus, past: boolean, from: Date, to: Date, hydrate = true): Promise<Booking[]> {
		let bookingDocs: IBooking[]

		const filter = { businessId: businessId }

		if (status !== undefined) {
			(filter as any).status = status
		}

		if (past != null) {
			(filter as any).endDate = past == true ? { $lt: new Date() } : { $gte: new Date() }
		}
		
		if (from != null) {
			(filter as any).endDate = { $gte: from }
		}

		if (to != null) {
			(filter as any).startDate = { $lte: to }
		}

		try {
			bookingDocs = await BookingDbModel.BookingModel.find(filter).sort({ startDate: 1 }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve bookings for business (${businessId})`, err)
			throw new DatabaseError(`Failed to retrieve bookings for business (${businessId})`)
		}

		const bookings = bookingDocs.map(bd => BookingDbModel.convertToDomainModel(bd))
		if (hydrate == true) {
			await BookingsService.hydrateBookings(bookings)
		}
		return bookings
	}

	public static async getForBusinessAndService(businessId: string, serviceId: string, status: BookingStatus, past: boolean, from: Date, to: Date, hydrate = true): Promise<Booking[]> {
		let bookingDocs: IBooking[]

		const filter = { businessId: businessId, serviceId: serviceId }

		if (status !== undefined) {
			(filter as any).status = status
		}

		if (past != null) {
			(filter as any).endDate = past == true ? { $lt: new Date() } : { $gte: new Date() }
		}

		if (from != null) {
			(filter as any).endDate = { $gte: from }
		}

		if (to != null) {
			(filter as any).startDate = { $lte: to }
		}

		try {
			bookingDocs = await BookingDbModel.BookingModel.find(filter).sort({ startDate: -1 }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve bookings for business (${businessId} and service ${serviceId})`, err)
			throw new DatabaseError(`Failed to retrieve bookings for business (${businessId} and service ${serviceId})`)
		}

		const bookings = bookingDocs.map(bd => BookingDbModel.convertToDomainModel(bd))
		if (hydrate == true) {
			await BookingsService.hydrateBookings(bookings)
		}
		return bookings
	}

	public static async getUnfinishedBookingDocs(): Promise<IBooking[]> {
		try {
			return await BookingDbModel.BookingModel.find({ status: BookingStatus.Approved, endDate: { $gt: new Date() }}).exec()
		} catch (err) {
			Logger.logger.error("Failed to retrieve bookings not finished bookings", err)
			throw new DatabaseError("Failed to retrieve bookings not finished bookings")
		}
	}

	public static async create(booking: Booking): Promise<Booking> {

		const referencedBusiness = await BusinessesService.getById(booking.business.id)
		const referencedService = referencedBusiness.services?.find(s => s.id == booking.service.id)

		if (!referencedBusiness.isActive) {
			Logger.logger.warn(`Referenced business ${booking.business.id} is not active`)
			throw new BadRequestError(`Referenced business ${booking.business.id} is not active`)
		}

		if (referencedService == null) {
			Logger.logger.warn(`Referenced service ${booking.service.id} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Referenced service ${booking.service.id} doesn't exist`)
		}

		if (!referencedService.isActive) {
			Logger.logger.warn(`Referenced service ${booking.service.id} is not active`)
			throw new BadRequestError(`Referenced service ${booking.service.id} is not active`)
		}

		booking.startDate.setSeconds(0)
		booking.startDate.setMilliseconds(0)
		booking.endDate.setSeconds(0)
		booking.endDate.setMilliseconds(0)

		const calculatedEndDate = BookingsService.addTimeBlock(booking.startDate, referencedService.duration, referencedService.durationUnit)
		if (calculatedEndDate.getTime() != booking.endDate.getTime()) {
			Logger.logger.warn(`Calculated booking's end date (${DateUtils.dateToShortString(calculatedEndDate)}) doesn't match with the requested one (${DateUtils.dateToShortString(booking.endDate)})`)
			throw new BadRequestError(`Calculated booking's end date (${DateUtils.dateToShortString(calculatedEndDate)}) doesn't match with the requested one ${DateUtils.dateToShortString(booking.endDate)}`)
		}

		if (BookingsService.isBookingNotBetweenBusinessHours(booking, referencedBusiness)) {
			Logger.logger.warn(`Booking duration (${DateUtils.dateToShortString(booking.startDate)} - ${DateUtils.dateToShortString(booking.endDate)}) is not within business hours of business ${booking.business.id}`)
			throw new BadRequestError(`Booking duration (${DateUtils.dateToShortString(booking.startDate)} - ${DateUtils.dateToShortString(booking.endDate)}) is not within business hours`)
		}

		booking.status = BookingStatus.Pending
		if(referencedBusiness?.setting?.is_autoapprove){
			booking.status = BookingStatus.Approved
		}
		
		booking.serviceSnapshot = await BusinessServiceSnapshotsService.getServiceSnapshotForService(referencedService)

		const bookingDoc = BookingDbModel.convertToDbModel(booking)
		bookingDoc.customerCancellationToken = (new Object()) as Document

		do {
			bookingDoc.friendlyId = BookingsService.generateRandomFriendlyId()
		} while (await BookingsService.friendlyIdExsitsForBusiness(bookingDoc.friendlyId, bookingDoc.businessId))


		try {
			await BookingDbModel.BookingModel.create(bookingDoc)
		} catch (err) {
			Logger.logger.error(`Failed to create booking for business ${booking.business.id}')`, err)
			throw new DatabaseError(`Failed to create booking for business ${booking.business.id}')`)
		}

		try {
			await EmailService.sendBookingRequestToBusiness(referencedBusiness, bookingDoc, booking.serviceSnapshot)
		} catch {}
		try {
			await EmailService.sendBookingRequestToCustomer(referencedBusiness, bookingDoc, booking.serviceSnapshot)
		} catch {}

		const newBooking = BookingDbModel.convertToDomainModel(bookingDoc)
		newBooking.serviceSnapshot = booking.serviceSnapshot

		return newBooking
	}

	public static async partialUpdate(booking: Booking): Promise<Booking> {
		const business = await BusinessesService.getById(booking.business.id, false)

		const currentBookingDoc = await BookingsService.getBookingDocByIdForBusinessAndService(booking.id, booking.business.id, booking.service.id)

		if (currentBookingDoc == null) {
			Logger.logger.warn(`Booking ${booking.id} for business ${booking.business.id} for service ${booking.service.id} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Booking ${booking.id} for business ${booking.business.id} for service ${booking.service.id} doesn't exist`)
		}

		let resourceNotModified = true

		if (booking.status != null && booking.status != currentBookingDoc.status) {

			if (currentBookingDoc.status == BookingStatus.Rejected || currentBookingDoc.status == BookingStatus.Cancelled) {
				Logger.logger.warn(`Cannot update booking ${booking.id} status becasue it was already rejected or cancelled`)
				throw new BadRequestError(`Cannot update booking ${booking.id} status becasue it was already rejected or cancelled`)
			}

			if (currentBookingDoc.status == BookingStatus.Pending && booking.status == BookingStatus.Cancelled) {
				Logger.logger.warn(`Cannot update booking ${booking.id} status to Cancelled because it has not been approved/rejected yet`)
				throw new BadRequestError(`Cannot update booking ${booking.id} status to Cancelled because it has not been approved/rejected yet`)
			}

			if (currentBookingDoc.status == BookingStatus.Approved && booking.status != BookingStatus.Cancelled) {
				Logger.logger.warn(`Cannot update booking ${booking.id} status to anything but Cancelled because it has already been approved`)
				throw new BadRequestError(`Cannot update booking ${booking.id} status to anything but Cancelled because it has already been approved`)
			}

			if (currentBookingDoc.endDate < new Date()) {
				Logger.logger.warn(`Cannot update booking ${booking.id} status because it's past its end date`)
				throw new BadRequestError(`Cannot update booking ${booking.id} status because it's past its end date`)
			}

			currentBookingDoc.status = booking.status
			resourceNotModified = false
		}

		if (resourceNotModified == true) {
			return null
		}

		try {
			await currentBookingDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to partially update booking ${booking.id} for business ${booking.business.id}`, err)
			throw new DatabaseError(`Failed to partially update booking ${booking.id} for business ${booking.business.id}`)
		}

		const updatedBooking = BookingDbModel.convertToDomainModel(currentBookingDoc)
		await BookingsService.hydrateBooking(updatedBooking)

		let customerIcsFileString: string
		let businessIcsFileString: string

		try {
			customerIcsFileString = await IcsService.generateIcs(false, business, currentBookingDoc, updatedBooking.serviceSnapshot)
		} catch (err) {
			Logger.logger.warn(`Failed to generate customer .ics file for booking ${currentBookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
		}

		try {
			businessIcsFileString = await IcsService.generateIcs(true, business, currentBookingDoc, updatedBooking.serviceSnapshot)
		} catch (err) {
			Logger.logger.warn(`Failed to generate business .ics file for booking ${currentBookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
		}

		try {
			switch (currentBookingDoc.status) {
				case BookingStatus.Approved:
					await EmailService.sendBookingApprovedToCustomer(business, currentBookingDoc, updatedBooking.serviceSnapshot, customerIcsFileString)
					await EmailService.sendBookingApprovedToBusiness(business, currentBookingDoc, updatedBooking.serviceSnapshot, businessIcsFileString)
					break
				case BookingStatus.Rejected:
					await EmailService.sendBookingRejectedToCustomer(business, updatedBooking)
					break
				case BookingStatus.Cancelled:
					await EmailService.sendBookingCancelledToCustomer(business, updatedBooking)
					break
				default:
					break
			}
		} catch {}

		return updatedBooking
	}

	public static async customerCancel(bookingId: string, customerCancelTokenId: string): Promise<void> {
		let bookingDoc: IBooking

		try {
			bookingDoc = await BookingDbModel.BookingModel.findById(bookingId).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve booking by id ${bookingId}`, err)
			throw new DatabaseError(`Failed to retrieve booking by id ${bookingId}`)
		}

		if (bookingDoc?.customerCancellationToken?._id.toString() != customerCancelTokenId) {
			Logger.logger.warn(`Booking ${bookingId} or its cancellation token ${customerCancelTokenId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Booking ${bookingId} or its cancellation token ${customerCancelTokenId} doesn't exist`)
		}

		const business = await BusinessesService.getById(bookingDoc.businessId, false)

		if (bookingDoc.status == BookingStatus.Rejected || bookingDoc.status == BookingStatus.Cancelled ||
			bookingDoc.endDate < new Date()) {
			Logger.logger.warn(`Cannot cancel booking ${bookingId} because it is past its end date or it was already rejected or cancelled`)
			throw new BadRequestError(`Cannot cancel booking ${bookingId} because it is past its end date or it was already rejected or cancelled`)
		}

		bookingDoc.status = BookingStatus.Cancelled
		bookingDoc.customerCancellationToken = undefined

		try {
			await bookingDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update booking ${bookingId} when cancelling booking by customer`, err)
			throw new DatabaseError(`Failed to update booking ${bookingId} when cancelling booking by customer`)
		}

		const booking = BookingDbModel.convertToDomainModel(bookingDoc)
		await BookingsService.hydrateBooking(booking)

		try {
			await EmailService.sendBookingCancelledToBusiness(business, booking)
		} catch {}
	}

	private static async getBookingDocByIdForBusiness(bookingId: string, businessId: string): Promise<IBooking> {
		try {
			return await BookingDbModel.BookingModel.findOne({ _id: bookingId, businessId: businessId }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve booking by id ${bookingId} for business (${businessId})`, err)
			throw new DatabaseError(`Failed to retrieve booking by id ${bookingId} for business (${businessId})`)
		}
	}

	private static async getBookingDocByIdForBusinessAndService(bookingId: string, businessId: string, serviceId: string): Promise<IBooking> {
		try {
			return await BookingDbModel.BookingModel.findOne({ _id: bookingId, businessId: businessId, serviceId: serviceId }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve booking by id ${bookingId} for business ${businessId} and service ${serviceId}`, err)
			throw new DatabaseError(`Failed to retrieve booking by id ${bookingId} for business ${businessId} and service ${serviceId}`)
		}
	}

	private static generateRandomFriendlyId(): string {
		let id = ""
		const allowedCharacters = "abcdefghijklmnopqrstuvwxyz0123456789"
		
		for (let i = 0; i < 5; i++) {
			id += allowedCharacters.at(Math.floor(Math.random() * allowedCharacters.length))
		}

		return id
	}

	private static async friendlyIdExsitsForBusiness(friendlyId: string, businessId: string): Promise<boolean> {
		try {
			return await BookingDbModel.BookingModel.exists({ businessId: businessId, friendlyId: friendlyId }) != null
		} catch (err) {
			Logger.logger.error(`Failed to check that friendly booking id (${friendlyId}) exists for business (${businessId})`, err)
			throw new DatabaseError(`Failed to check that friendly booking id (${friendlyId}) exists for business (${businessId})`)
		}
	}

	private static addTimeBlock(date: Date, blockLength: number, blockUnit: DurationUnit): Date {
		const result = new Date(date)

		switch (blockUnit) {
			case DurationUnit.Minute:
				result.setMinutes(date.getMinutes() + blockLength)
				return result
			case DurationUnit.Hour:
				result.setHours(date.getHours() + blockLength)
				return result
			// case DurationUnit.Day:
			// 	result.setDate(date.getDate() + blockLength)
			// 	return result
			// case DurationUnit.Week:
			// 	// what about time changes? A week from Wednesday, for example, should be next Wednesday
			// 	// regardless of time changes
			// 	result.setDate(date.getDate() + (blockLength * 7))
			// 	return result
			default:
				throw new Error(`Adding block length unit ${blockLength} is not implemented`)
		}
	}

	private static isBookingNotBetweenBusinessHours(booking: Booking, business: Business): boolean {

		if (business.isOperatingNonStop) {
			return false
		}

		if (business.businessHoursBlocks == null) {
			return true
		}

		const bookingLocalStartTimeInt = BookingsService.getLocalTimeInt(booking.startDate, business.timeZone)
		const bookingLocalEndTimeInt = BookingsService.getLocalTimeInt(booking.endDate, business.timeZone)
		const bookingDurationInt = BookingsService.calculateDifferenceBetweenTimeInt(bookingLocalStartTimeInt, bookingLocalEndTimeInt)

		
		for (const businessHoursBlock of business.businessHoursBlocks) {
			const businessHoursBlockStartInt = businessHoursBlock.getStartTimeInteger()
			const businessHoursBlockEndInt = businessHoursBlock.getEndTimeInteger()
			const businessHoursBlockDuration = BookingsService.calculateDifferenceBetweenTimeInt(businessHoursBlockStartInt, businessHoursBlockEndInt)

			if (bookingDurationInt <= businessHoursBlockDuration) {
				if (businessHoursBlockEndInt > businessHoursBlockStartInt) {
					if (bookingLocalStartTimeInt >= businessHoursBlockStartInt && bookingLocalStartTimeInt < businessHoursBlockEndInt) {
						return false
					}
				} else {
					if ((bookingLocalStartTimeInt >= businessHoursBlockStartInt && bookingLocalStartTimeInt <= 62359) ||
							bookingLocalStartTimeInt >= 0 && bookingLocalStartTimeInt < businessHoursBlockEndInt) {
						return false
					}
				}
			}
		}

		return true
	}

	private static getLocalTimeInt(date: Date, timeZone: TimeZone): number {
		return Number(`${DateUtils.getLocalDayOfTheWeek(date, timeZone)}${DateUtils.getLocalHourString(date, timeZone)}${DateUtils.getLocalMinuteString(date, timeZone)}`)
	}

	private static calculateDifferenceBetweenTimeInt(startTimeIntA: number, endTimeIntB: number): number {
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

		return Number(`${resultDays}${resultHours.toString().padStart(2, '0')}${resultMinutes.toString().padStart(2, '0')}`)
	}

	private static async hydrateBooking(booking: Booking): Promise<void> {
		booking.serviceSnapshot = await BusinessServiceSnapshotsService.getById(booking.serviceSnapshot.id)
	}

	private static async hydrateBookings(bookings: Booking[]): Promise<void> {
		const snapshots = await BusinessServiceSnapshotsService.getByIds(bookings.map(b => b.serviceSnapshot.id))

		for (const booking of bookings) {
			booking.serviceSnapshot = snapshots.find(s => s.id == booking.serviceSnapshot.id)
		}
	}

}
