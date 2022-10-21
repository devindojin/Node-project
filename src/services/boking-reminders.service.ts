import { BookingReminderDbModel, IBookingReminder } from "../db-models/booking-reminder.db-model"
import { IBooking } from "../db-models/booking.db-model"
import { Logger } from "../logger"
import { BookingReminder } from "../types/booking-reminder"
import { BookingReminderType } from "../types/enums/booking-reminder-type.enum"
import { DateUtils } from "../utils/date.utils"
import { BookingsService } from "./bookings.service"
import { BusinessServiceSnapshotsService } from "./business-service-snapshots.service"
import { BusinessServicesService } from "./business-services.service"
import { BusinessesService } from "./businesses.service"
import { EmailService } from "./email.service"

export abstract class BookingRemindersService {
	
	public static async sendReminders(): Promise<void> {
		Logger.logger.info("Sending booking reminders...")
		const unfinishedBookingDocs = await BookingsService.getUnfinishedBookingDocs()
		let sentRemindersCount = 0

		if (unfinishedBookingDocs.length == 0) {
			Logger.logger.info(`...No unfinished bookings were found. ${sentRemindersCount} reminders were sent`)
			return
		}

		const business = await BusinessesService.getByIds(unfinishedBookingDocs.map(b => b.businessId))
		const businessServices = await BusinessServicesService.getByIds(unfinishedBookingDocs.map(b => b.serviceId), false)
		const snapshots = await BusinessServiceSnapshotsService.getByIds(unfinishedBookingDocs.map(b => b.serviceSnapshotId))

		const now = new Date()

		for (const booking of unfinishedBookingDocs) {
			const matchingBusiness = business.find(b => b.id == booking.businessId)
			if (matchingBusiness == null) {
				Logger.logger.warn(`Failed to find matching business (${booking.businessId}) for booking ${booking._id}`)
				continue
			}

			const matchingService = businessServices.find(s => s.id == booking.serviceId)
			if (matchingService == null) {
				Logger.logger.warn(`Failed to find matching service (${booking.serviceId}) for booking ${booking._id}`)
				continue
			}

			const matchingSnapshot = snapshots.find(s => s.id == booking.serviceSnapshotId)
			if (matchingSnapshot == null) {
				Logger.logger.warn(`Failed to find matching snapshot (${booking.serviceSnapshotId}) for booking ${booking._id}`)
				continue
			}

			const minutesBeforeBookingStart = DateUtils.differenceInMinutes(now, booking.startDate)

			const dueReminders: BookingReminder[] = []

			for (const bookingReminder of matchingService.bookingReminders) {
				if (bookingReminder.minutesInAdvance < minutesBeforeBookingStart ||
					booking.sentReminders.some(r => r.minutesInAdvance < bookingReminder.minutesInAdvance)) {
					continue
				}

				const matchingSentReminder = booking.sentReminders.find(sr => sr.minutesInAdvance == bookingReminder.minutesInAdvance)
				if (matchingSentReminder == null) {
					dueReminders.push(bookingReminder)
					continue
				}

				const dueReminder = new BookingReminder(bookingReminder.minutesInAdvance, [])
				dueReminder.types.push(...bookingReminder.types.filter(rt => !matchingSentReminder.types.some(st => st == rt)))
				if (dueReminder.types.length == 0) {
					continue
				}
				dueReminders.push(dueReminder)
			}

			const reminderToBeSent = BookingRemindersService.getLatestReminder(dueReminders)

			if (reminderToBeSent == null) {
				continue
			}

			for (const reminderType of reminderToBeSent.types) {
				const matchingSentReminder = booking.sentReminders.find(r => r.minutesInAdvance == reminderToBeSent.minutesInAdvance)

				switch (reminderType) {
					case BookingReminderType.Email:
						try {
							await EmailService.sendBookingReminderToCustomer(matchingBusiness, matchingSnapshot, booking)
						} catch {}
						sentRemindersCount++
						await BookingRemindersService.updateSentReminder(reminderToBeSent.minutesInAdvance, reminderType, matchingSentReminder, booking)
						break
					// case BookingReminderType.WhatsApp:
						// await ...
						// sentRemindersCount++
						// await BookingRemindersService.updateSentReminder(reminderToBeSent.minutesInAdvance, reminderType, matchingSentReminder, booking)
						// break
					default:
						throw new Error(`Sending reminder of type ${BookingReminderType[reminderType]} is not implemented`);
				}
			}
		}

		Logger.logger.info(`...Finished sending reminders. ${sentRemindersCount} reminders were sent`)
	}

	private static async updateSentReminder(minutesInAdvance: number, reminderType: BookingReminderType, matchingSentReminder: IBookingReminder, bookingDoc: IBooking): Promise<void> {
		if (matchingSentReminder == null) {
			bookingDoc.sentReminders.push(BookingReminderDbModel.convertToDbModel(new BookingReminder(minutesInAdvance, [ reminderType ])))
		} else {
			matchingSentReminder.types.push(reminderType)
		}

		try {
			await bookingDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update sentReminders for booking ${bookingDoc._id} after sending ${minutesInAdvance} minute ${BookingReminderType[reminderType]} reminder`, err)
		}
	}

	private static getLatestReminder(reminders: IBookingReminder[]): IBookingReminder {
		let latestReminder: IBookingReminder

		for (const reminder of reminders) {
			if(latestReminder == null || reminder.minutesInAdvance < latestReminder.minutesInAdvance) {
				latestReminder = reminder
			}
		}

		return latestReminder
	}

}