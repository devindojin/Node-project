import * as Joi from "joi"

import { BusinessType } from "../types/business-type"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"


export abstract class BusinessTypeValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<BusinessType> =
		Joi.object({
			id: IdValidator.readValidationSchema,
			name: Joi.string().trim().min(2).max(30).optional().allow(null)
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessType>(payload, BusinessTypeValidator.readValidationSchema)
	}
}