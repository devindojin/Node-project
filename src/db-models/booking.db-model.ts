import { Schema, Document, model } from "mongoose"

import { Booking } from "../types/booking"
import { Business } from "../types/business"
import { BusinessService } from "../types/business-service"
import { BusinessServiceSnapshot } from "../types/business-service-snapshot"
import { BookingStatus } from "../types/enums/booking.status"
import { BookingReminderDbModel, IBookingReminder } from "./booking-reminder.db-model"
import { CustomerDbModel, ICustomer } from "./customer.db-model"

export abstract class BookingDbModel {

	private static bookingSchema = new Schema({
		businessId: String,
		serviceId: String,
		friendlyId: {
			type: String,
			lowercase: true
		},
		startDate: Date,
		endDate: Date,
		customer: CustomerDbModel.customerSchema,
		notes: String,
		status: {
			type: Number,
			enum: Object.values(BookingStatus).filter(v => Number.isInteger(v))
		},
		serviceSnapshotId: String,
		sentReminders: [ BookingReminderDbModel.ReminderSchema ],
		customerCancellationToken: new Schema({})
	})
		.index(
			{ businessId: 1, friendlyId: 1 },
			{ unique: true }
		)

	public static BookingModel = model<IBooking>('booking', BookingDbModel.bookingSchema)

	public static convertToDbModel(booking: Booking): IBooking {
		return new BookingDbModel.BookingModel({
			businessId: booking.business.id,
			serviceId: booking.service.id,
			friendlyId: booking.friendlyId,
			startDate: booking.startDate,
			endDate: booking.endDate,
			customer: CustomerDbModel.convertToDbModel(
				booking.customer
			),
			notes: booking.notes == null ?
				undefined :
				booking.notes,
			status: booking.status,
			serviceSnapshotId: booking.serviceSnapshot.id
		})
	}

	public static convertToDomainModel(bookingDoc: IBooking): Booking {
		return new Booking(
			bookingDoc._id.toString(),
			new Business(bookingDoc.businessId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined),
			new BusinessService(bookingDoc.serviceId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined),
			bookingDoc.friendlyId,
			bookingDoc.startDate,
			bookingDoc.endDate,
			CustomerDbModel.convertToDomainModel(
				bookingDoc.customer
			),
			bookingDoc.notes == null ?
				undefined :
				bookingDoc.notes,
			bookingDoc.status,
			new BusinessServiceSnapshot(bookingDoc.serviceSnapshotId, undefined, undefined, undefined, undefined, undefined, undefined, undefined))
	}
}

export interface IBooking extends Document {
	businessId: string
	serviceId: string
	friendlyId: string
	startDate: Date
	endDate: Date
	customer: ICustomer
	notes: string,
	status: BookingStatus
	serviceSnapshotId: string
	sentReminders: IBookingReminder[]
	customerCancellationToken: Document
}