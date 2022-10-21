import * as Joi from "joi"

import { BusinessService } from "../types/business-service"
import { Currency } from "../types/enums/currency"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"
import { ServiceCategoryValidator } from "./service-category.validator"


export abstract class BusinessServiceValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<BusinessService> =
		Joi.object({
			id: IdValidator.readValidationSchema,
			name: Joi.string().trim().min(2).max(40).optional().allow(null),
			description: Joi.string().trim().max(500).optional().allow(null),
			category: ServiceCategoryValidator.readValidationSchema.optional().allow(null),
			duration: Joi.number().integer().min(1).optional().allow(null),
			durationUnit: Joi.number().valid(...Object.values(DurationUnit).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			price: Joi.number().integer().min(0).optional().allow(null),
			currency: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			hash: Joi.string().hex().length(22).optional().allow(null),
			isActive: Joi.boolean().optional().allow(null),
			isDeleted: Joi.boolean().optional().allow(null),
		})

	public static createValidationSchema: Joi.ObjectSchema<BusinessService> =
		Joi.object({
			id: IdValidator.createValidationSchema,
			name: Joi.string().trim().min(2).max(40).required(),
			description: Joi.string().trim().max(500).optional().allow(null),
			category: ServiceCategoryValidator.readValidationSchema.optional().allow(null),
			duration: Joi.number().integer().min(1).required(),
			durationUnit: Joi.number().valid(...Object.values(DurationUnit).filter(v => Number.isInteger(v)))
				.required(),
			price: Joi.number().integer().min(0).optional().allow(null),
			currency: Joi.when('price', {
				is: Joi.number().integer().greater(0).required(),
				then: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
					.required(),
				otherwise: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
					.optional().allow(null)
			}),
			hash: Joi.string().hex().length(22).optional().allow(null),
			isActive: Joi.boolean().optional().allow(null),
			isDeleted: Joi.boolean().optional().allow(null),
		})

	public static updateValidationSchema: Joi.ObjectSchema<BusinessService> =
		Joi.object({
			id: IdValidator.createValidationSchema,
			name: Joi.string().trim().min(2).max(40).required(),
			description: Joi.string().trim().max(500).optional().allow(null),
			category: ServiceCategoryValidator.readValidationSchema.optional().allow(null),
			duration: Joi.number().integer().min(1).required(),
			durationUnit: Joi.number().valid(...Object.values(DurationUnit).filter(v => Number.isInteger(v)))
				.required(),
			price: Joi.number().integer().min(0).optional().allow(null),
			currency: Joi.when('price', {
				is: Joi.number().integer().greater(0).required(),
				then: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
					.required(),
				otherwise: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
					.optional().allow(null)
			}),
			hash: Joi.string().hex().length(22).optional().allow(null),
			isActive: Joi.boolean().optional().required(),
			isDeleted: Joi.boolean().optional().allow(null),
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessService>(payload, BusinessServiceValidator.readValidationSchema)
	}

	public static isInvalidForCreate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessService>(payload, BusinessServiceValidator.createValidationSchema)
	}

	public static isInvalidForUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessService>(payload, BusinessServiceValidator.updateValidationSchema)
	}
}