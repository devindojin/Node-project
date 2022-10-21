import { BookingReminderType } from "./enums/booking-reminder-type.enum"

export class BookingReminder {

	constructor(
			public minutesInAdvance: number,
			public types: BookingReminderType[]) {}
}