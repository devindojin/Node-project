import * as Joi from "joi"

import { Customer } from "../types/customer"
import { BaseValidator } from "./base.validator"


export abstract class CustomerValidator {

	public static createValidationSchema: Joi.ObjectSchema<Customer> = 
		Joi.object({
			name: Joi.string().trim().min(2).max(40).required(),
			surname: Joi.string().trim().min(2).max(40).required(),
			email: Joi.string().pattern(BaseValidator.emailRegex).min(6).max(50)
				.required(),
			phoneNumber: Joi.string().pattern(BaseValidator.phoneRegex)
				.optional().allow(null)
		})

}