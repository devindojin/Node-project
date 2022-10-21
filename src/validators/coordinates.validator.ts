import * as Joi from "joi"

import { Coordinates } from "../types/coordinates"
import { BaseValidator } from "./base.validator"


export abstract class CoordinatesValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<Coordinates> =
		Joi.object({
			latitude: Joi.number().min(-90).max(90).prefs({convert: false}).precision(16).optional().allow(null),
			longitude:Joi.number().min(-180).max(180).prefs({convert: false}).precision(16).optional().allow(null)
		})

	public static createOrUpdateValidationSchema: Joi.ObjectSchema<Coordinates> =
		Joi.object({
			latitude: Joi.number().min(-90).max(90).prefs({convert: false}).precision(16).required(),
			longitude:Joi.number().min(-180).max(180).prefs({convert: false}).precision(16).required()
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Coordinates>(payload, CoordinatesValidator.readValidationSchema)
	}

	public static isInvalidForCreateOrUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Coordinates>(payload, CoordinatesValidator.createOrUpdateValidationSchema)
	}
}