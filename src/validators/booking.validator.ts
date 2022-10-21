import * as Joi from "joi"

import { Booking } from "../types/booking"
import { BookingStatus } from "../types/enums/booking.status"
import { BaseValidator } from "./base.validator"
import { BusinessServiceSnapshotValidator } from "./business-service-snapshot.validator"
import { BusinessServiceValidator } from "./business-service.validator"
import { BusinessValidator } from "./business.validator"
import { CustomerValidator } from "./customer.validator"
import { IdValidator } from "./id.validator"

export abstract class BookingValidator {

	private static dateNotInPast = value => {
		if (new Date(value) < new Date()) {
			throw new Error("Date in the past")
		}
		return value
	}

	private static createValidationSchema: Joi.ObjectSchema<Booking> = 
		Joi.object({
			id: IdValidator.createValidationSchema,
			business: BusinessValidator.readValidationSchema.optional().allow(null),
			service: BusinessServiceValidator.readValidationSchema.optional().allow(null),
			friendlyId: Joi.string().length(5).pattern(BaseValidator.bookingFriendlyId).optional().allow(null),
			startDate: Joi.date().custom(BookingValidator.dateNotInPast).required(),
			endDate: Joi.date().greater(Joi.ref('startDate')).required(),
			customer: CustomerValidator.createValidationSchema.required(),
			notes: Joi.string().trim().max(600).optional().allow(null),
			status: Joi.number().valid(BookingStatus.Pending).optional().allow(null),
			serviceSnapshot: BusinessServiceSnapshotValidator.readValidationSchema.optional().allow(null)
		})

	private static partialUpdateValidationSchema: Joi.ObjectSchema<Booking> =
		Joi.object({
			id: IdValidator.createValidationSchema,
			business: BusinessValidator.readValidationSchema.optional().allow(null),
			service: BusinessServiceValidator.readValidationSchema.optional().allow(null),
			friendlyId: Joi.string().length(5).pattern(BaseValidator.bookingFriendlyId).optional().allow(null),
			startDate: Joi.date().custom(BookingValidator.dateNotInPast).optional().allow(null),
			endDate: Joi.date().greater(Joi.ref('startDate')).optional().allow(null),
			customer: CustomerValidator.createValidationSchema.optional().allow(null),
			notes: Joi.string().trim().max(600).optional().allow(null),
			status: Joi.number().valid(...Object.values(BookingStatus).filter(bs => Number.isInteger(bs) && bs != BookingStatus.Pending)).optional().allow(null),
			serviceSnapshot: BusinessServiceSnapshotValidator.readValidationSchema.optional().allow(null)
		})
			.or('status')

	public static isInvalidForCreate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Booking>(payload, BookingValidator.createValidationSchema)
	}

	public static isInvalidForPartialUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Booking>(payload, BookingValidator.partialUpdateValidationSchema)
	}
}