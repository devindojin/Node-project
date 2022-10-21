import Joi = require("joi")

export abstract class IdValidator {
	public static readValidationSchema: Joi.StringSchema = 
		Joi.string().hex().length(24).required()

	public static createValidationSchema: Joi.StringSchema =
		Joi.string().hex().length(24).optional().allow(null)

	public static isInvalidForRead(id: string): boolean {
		const { error } = IdValidator.readValidationSchema.validate(id)
		return error != null
	}

	public static isInvalidForCreate(id: string): boolean {
		const { error } = IdValidator.createValidationSchema.validate(id)
		return error != null
	}
}