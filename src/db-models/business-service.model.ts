import { Schema, Document, model } from "mongoose"

import { BusinessService } from "../types/business-service"
import { Currency } from "../types/enums/currency"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { ServiceCategory } from "../types/service-category"
import { BookingReminderDbModel, IBookingReminder } from "./booking-reminder.db-model"

export abstract class BusinessServiceDbModel {

	public static businessServiceSchema = new Schema({
		businessId: String,
		name: String,
		description: String,
		categoryId: String,
		duration: Number,
		durationUnit: {
			type: Number,
			enum: Object.values(DurationUnit).filter(v => Number.isInteger(v))
		},
		price: Number,
		currency: {
			type: Number,
			enum: Object.values(Currency).filter(v => Number.isInteger(v))
		},
		hash: String,
		bookingReminders: [ BookingReminderDbModel.ReminderSchema ],
		isActive: Boolean,
		isDeleted: Boolean
	})

	public static BusinessServiceModel = model<IBusinessService>('business-service', BusinessServiceDbModel.businessServiceSchema)

	public static convertToDbModel(businessId: string, businessService: BusinessService): IBusinessService {
		return new BusinessServiceDbModel.BusinessServiceModel({
			businessId: businessId,
			name: businessService.name,
			description: businessService.description == null ?
				undefined :
				businessService.description,
			categoryId: businessService.category == null ?
				undefined :
				businessService.category.id,
			duration: businessService.duration,
			durationUnit: businessService.durationUnit,
			price: businessService.price,
			currency: businessService.currency == null ?
				undefined :
				businessService.currency,
			hash: businessService.hash,
			bookingReminders: businessService.bookingReminders == null ?
				undefined :
				businessService.bookingReminders.map(r => BookingReminderDbModel.convertToDbModel(r)),
			isActive: businessService.isActive,
			isDeleted: businessService.isDeleted
		})
	}

	public static convertToDomainModel(businessServiceDoc: IBusinessService): BusinessService {
		return new BusinessService(
			businessServiceDoc._id.toString(),
			businessServiceDoc.name,
			businessServiceDoc.description == null ?
				undefined :
				businessServiceDoc.description,
			businessServiceDoc.categoryId == null ?
				undefined :
				new ServiceCategory(businessServiceDoc.categoryId, undefined, undefined),
			businessServiceDoc.duration,
			businessServiceDoc.durationUnit,
			businessServiceDoc.price,
			businessServiceDoc.currency == null ?
				undefined :
				businessServiceDoc.currency,
			businessServiceDoc.hash,
			businessServiceDoc.bookingReminders == null ?
				undefined :
				businessServiceDoc.bookingReminders.map(r => BookingReminderDbModel.convertToDomainModel(r)),
			businessServiceDoc.isActive,
			businessServiceDoc.isDeleted)
	}
}

export interface IBusinessService extends Document {
	businessId: string
	name: string
	description: string
	categoryId: string
	duration: number
	durationUnit: number
	price: number
	currency: number
	hash: string
	bookingReminders: IBookingReminder[]
	isActive: boolean
	isDeleted: boolean
}