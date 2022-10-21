import * as Joi from "joi"

import { ServiceCategory } from "../types/service-category"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"


export abstract class ServiceCategoryValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<ServiceCategory> =
		Joi.object({
			id: IdValidator.readValidationSchema,
			name: Joi.string().trim().min(2).max(30).optional().allow(null),
			description: Joi.string().trim().min(2).max(300).optional().allow(null)
		})

	public static createAndUpdateValidationSchema: Joi.ObjectSchema<ServiceCategory> =
		Joi.object({
			id: IdValidator.createValidationSchema,
			name: Joi.string().trim().min(2).max(30).required(),
			description: Joi.string().trim().min(2).max(300).optional().allow(null)
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<ServiceCategory>(payload, ServiceCategoryValidator.readValidationSchema)
	}

	public static isInvalidForCreateOrUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<ServiceCategory>(payload, ServiceCategoryValidator.createAndUpdateValidationSchema)
	}

}