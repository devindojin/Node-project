import * as Joi from "joi"

import { Business } from "../types/business"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"
import { BusinessTypeValidator } from "./business-type.validator"
import { AddressValidator } from "./address.validator"
import { TimeZone } from "../types/enums/time-zone.enum"
import { BusinessHoursBlockValidator } from "./business-hours-block.validator"
import { BusinessServiceValidator } from "./business-service.validator"
import { Currency } from "../types/enums/currency"
import { CoordinatesValidator } from "./coordinates.validator"
import { ServiceCategoryValidator } from "./service-category.validator"

export abstract class BusinessValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<Business> =
		Joi.object({
			id: IdValidator.readValidationSchema,
			name: Joi.string().trim().min(2).max(40).optional().allow(null),
			slug: Joi.string().pattern(BaseValidator.slugRegex).min(2).max(50).optional().allow(null),
			phoneNumber: Joi.string().pattern(BaseValidator.phoneRegex).min(2).max(13).optional().allow(null),
			address: AddressValidator.readValidationSchema.optional().allow(null),
			coordinates: CoordinatesValidator.readValidationSchema.optional().allow(null),
			email: Joi.string().pattern(BaseValidator.emailRegex)
				.min(6).max(50).optional().allow(null),
			password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex).optional().allow(null),
			type: BusinessTypeValidator.readValidationSchema.optional().allow(null),
			timeZone: Joi.string().valid(...Object.values(TimeZone)).optional().allow(null),
			currency: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			isOperatingNonStop: Joi.boolean().optional().allow(null),
			businessHoursBlocks: Joi.array().items(BusinessHoursBlockValidator.readValidationSchema)
				.unique((a, b) => a.startDayOfTheWeek == b.startDayOfTheWeek &&
					a.startHour == b.startHour &&
					a.startMinute == b.startMinute &&
					a.endDayOfTheWeek == b.endDayOfTheWeek && 
					a.endHour == b.endHour && 
					a.endMinute == b.endMinute)
				.optional().allow(null),
			about: Joi.string().trim().max(500).optional().allow(null),
			services: Joi.array().items(BusinessServiceValidator.readValidationSchema).optional().allow(null),
			serviceCategories: Joi.array().items(ServiceCategoryValidator.readValidationSchema).optional().allow(null),
			isActive: Joi.boolean().optional().allow(null),
			isDeleted: Joi.boolean().optional().allow(null)
		})

	private static createValidationSchema: Joi.ObjectSchema<Business> =
		Joi.object({
			id: IdValidator.createValidationSchema,
			name: Joi.string().trim().min(2).max(40).optional().allow(null),
			slug: Joi.string().pattern(BaseValidator.slugRegex).min(2).max(50).optional().allow(null),
			phoneNumber: Joi.string().pattern(BaseValidator.phoneRegex).min(2).max(13).optional().allow(null),
			address: AddressValidator.readValidationSchema.optional().allow(null),
			coordinates: CoordinatesValidator.readValidationSchema.optional().allow(null),
			email: Joi.string().pattern(BaseValidator.emailRegex)
				.min(6).max(50).required(),
			password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex).required(),
			type: BusinessTypeValidator.readValidationSchema.optional().allow(null),
			timeZone: Joi.string().valid(...Object.values(TimeZone)).optional().allow(null),
			currency: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			isOperatingNonStop: Joi.boolean().optional().allow(null),
			businessHoursBlocks: Joi.array().items(BusinessHoursBlockValidator.createOrUpdateValidationSchema)
				.unique((a, b) => a.startDayOfTheWeek == b.startDayOfTheWeek &&
					a.startHour == b.startHour &&
					a.startMinute == b.startMinute &&
					a.endDayOfTheWeek == b.endDayOfTheWeek && 
					a.endHour == b.endHour && 
					a.endMinute == b.endMinute)
				.optional().allow(null),
			about: Joi.string().trim().max(500).optional().allow(null),
			services: Joi.array().items(BusinessServiceValidator.readValidationSchema).optional().allow(null),
			serviceCategories: Joi.array().items(ServiceCategoryValidator.readValidationSchema).optional().allow(null),
			isActive: Joi.boolean().optional().allow(null),
			isDeleted: Joi.boolean().optional().allow(null)
		})

	// private static updateValidationSchema: Joi.ObjectSchema<Business> = 
	// 	Joi.object({
	// 		id: IdValidator.createValidationSchema,
	// 		name: Joi.string().trim().min(2).max(40).required(),
	// 		slug: Joi.string().pattern(BaseValidator.slugRegex).min(2).max(50).required(),
	// 		phoneNumber: Joi.string().pattern(BaseValidator.phoneRegex).min(2).max(13).required(),
	// 		address: AddressValidator.createOrUpdateValidationSchema.required(),
	// 		email: Joi.string().pattern(BaseValidator.emailRegex)
	// 			.min(6).max(50).required(),
	// 		password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex).optional().allow(null),
	// 		type: BusinessTypeValidator.readValidationSchema.optional().allow(null),
	//		timeZone: Joi.string().valid(...Object.values(TimeZone)).required(),
	// 		bookableTimeBlockLength: Joi.number().integer().min(1).required(),
	// 		bookableTimeBlockUnit: Joi.number().valid(...Object.values(TimeBlockLengthUnit).filter(v => Number.isInteger(v)))
	// 			.required(),
	// 		about: Joi.string().trim().max(500).optional().allow(null),
	// 		isActive: Joi.boolean().optional().allow(null),
	// 		isDeleted: Joi.boolean().optional().allow(null)
	// 	})

	public static partialUpdateValidationSchema: Joi.ObjectSchema<Business> = 
		Joi.object({
			id: IdValidator.createValidationSchema,
			name: Joi.string().trim().min(2).max(40).optional().allow(null),
			slug: Joi.string().pattern(BaseValidator.slugRegex).min(2).max(50).optional().allow(null),
			phoneNumber: Joi.string().pattern(BaseValidator.phoneRegex).min(2).max(13).optional().allow(null),
			address: AddressValidator.createOrUpdateValidationSchema.optional().allow(null),
			coordinates: CoordinatesValidator.createOrUpdateValidationSchema.optional().allow(null),
			email: Joi.string().pattern(BaseValidator.emailRegex)
				.min(6).max(50).optional().allow(null),
			password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex).optional().allow(null),
			type: BusinessTypeValidator.readValidationSchema.optional().allow(null),
			timeZone: Joi.string().valid(...Object.values(TimeZone)).optional().allow(null),
			currency: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			isOperatingNonStop: Joi.boolean().optional().allow(null),
			businessHoursBlocks: Joi.array().items(BusinessHoursBlockValidator.createOrUpdateValidationSchema)
				.unique((a, b) => a.startDayOfTheWeek == b.startDayOfTheWeek &&
					a.startHour == b.startHour &&
					a.startMinute == b.startMinute &&
					a.endDayOfTheWeek == b.endDayOfTheWeek && 
					a.endHour == b.endHour && 
					a.endMinute == b.endMinute)
				.optional().allow(null),
			about: Joi.string().trim().max(500).optional().allow(null, ''),
			services: Joi.array().items(BusinessServiceValidator.readValidationSchema).optional().allow(null),
			serviceCategories: Joi.array().items(ServiceCategoryValidator.readValidationSchema).optional().allow(null),
			isActive: Joi.boolean().optional().allow(null),
			isDeleted: Joi.boolean().optional().allow(null)
		})
			.or('name', 'slug', 'phoneNumber', 'address', 'coordinates', 'email', 'password', 'type', 'timeZone', 'currency', 'isOperatingNonStop', 'businessHoursBlocks', 'about')

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Business>(payload, BusinessValidator.readValidationSchema)
	}

	public static isInvalidForCreate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Business>(payload, BusinessValidator.createValidationSchema)
	}

	// public static isInvalidForUpdate(payload: any): boolean {
	// 	return BaseValidator.isInvalidForSchema<Business>(payload, BusinessValidator.updateValidationSchema)
	// }

	public static isInvalidForPartialUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Business>(payload, BusinessValidator.partialUpdateValidationSchema)
	}

}