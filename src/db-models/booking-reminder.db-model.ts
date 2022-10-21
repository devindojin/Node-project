import { Schema } from "mongoose"

import { BookingReminderType } from "../types/enums/booking-reminder-type.enum"
import { BookingReminder } from "../types/booking-reminder"


export abstract class BookingReminderDbModel {

	public static ReminderSchema = new Schema({
			minutesInAdvance: Number,
			types: [{
				type: Number,
				enum: Object.values(BookingReminderType).filter(v => Number.isInteger(v))
			}]
		},
		{ _id: false }
	)

	public static convertToDbModel(reminder: BookingReminder): IBookingReminder {
		return {
			minutesInAdvance: reminder.minutesInAdvance,
			types: reminder.types
		}
	}

	public static convertToDomainModel(reminderDoc: IBookingReminder): BookingReminder {
		return new BookingReminder(
			reminderDoc.minutesInAdvance,
			reminderDoc.types
		)
	}
}

export interface IBookingReminder {
	minutesInAdvance: number,
	types: number[]
}