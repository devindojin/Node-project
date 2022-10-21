import * as Joi from "joi"

import { Address } from "../types/address"
import { BaseValidator } from "./base.validator"


export abstract class AddressValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<Address> =
		Joi.object({
			address: Joi.string().trim().min(2).max(200).optional().allow(null),
			city: Joi.string().trim().max(50).optional().allow(null),
			country: Joi.string().trim().max(35).optional().allow(null)
		})

	public static createOrUpdateValidationSchema: Joi.ObjectSchema<Address> =
		Joi.object({
			address: Joi.string().trim().min(2).max(200).required(),
			city: Joi.string().trim().max(50).optional().allow(null),
			country: Joi.string().trim().max(35).optional().allow(null)
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Address>(payload, AddressValidator.readValidationSchema)
	}

	public static isInvalidForCreateOrUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Address>(payload, AddressValidator.createOrUpdateValidationSchema)
	}
}
