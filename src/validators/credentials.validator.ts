import Joi = require("joi")

import { Credentials } from "../types/credentials"
import { BaseValidator } from "./base.validator"

export abstract class CredentialsValidator {

	private static readValidationSchema: Joi.ObjectSchema<Credentials> = 
		Joi.object({
			email: Joi.string().pattern(BaseValidator.emailRegex)
				.min(6).max(50).required(),
			password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex).required()
		})

	private static passwordResetTokenRequestValidationSchema: Joi.ObjectSchema<Credentials> = 
		Joi.object({
			email: Joi.string().pattern(BaseValidator.emailRegex).min(6).max(50)
				.required(),
			password: Joi.valid(null)
		})

	private static newPasswordValidationSchema: Joi.ObjectSchema<Credentials> =
		Joi.object({
			email: Joi.valid(null),
			password: Joi.string().min(6).max(100).pattern(BaseValidator.passwordRegex)
				.required()
		})

	public static isInvalid(payload: any): boolean {
		return BaseValidator.isInvalidForSchema(payload, CredentialsValidator.readValidationSchema)
	}

	public static isInvalidForPasswordResetTokenRequest(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Credentials>(payload, CredentialsValidator.passwordResetTokenRequestValidationSchema)
	}

	public static isInvalidForNewPassword(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<Credentials>(payload, CredentialsValidator.newPasswordValidationSchema)
	}
}

