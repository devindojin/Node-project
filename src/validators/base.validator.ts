import Joi = require("joi")
import { Logger } from "../logger"

export abstract class BaseValidator {
	public static emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	public static passwordRegex = /^(?=.*[0-9]).+$/
	public static phoneRegex = /^\+?[0-9]{7,13}$/
	public static slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
	public static imgMimeTypeRegex = /^data:(image\/[a-zA-Z\.+]{3,18});base64$/
	public static timeRegex = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/
	public static ccNumberRegex = /^\d{16}$/
	public static ccExpiryRegex = /^(?:(?:0[1-9])|(?:1[0-2]))\/20[2-9]\d{1}$/
	public static ccSecurityRegex = /^\d{3}$/
	public static aliasRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i
	public static bookingFriendlyId = /^[a-z0-9]{5}$/i

	public static isInvalidForSchema<T>(payload: any, schema: Joi.ObjectSchema<T>): boolean {
		const { error } = schema.validate(payload)
		if (error != null) {
			Logger.logger.warn("Validation failed", error)
			return true
		}
		return false
	}

	public static isInvalidForCollectionSchema(payload: any, collectionSchema: Joi.ArraySchema): boolean {
		const { error } = collectionSchema.validate(payload)
		if (error != null) {
			Logger.logger.warn("Validation failed", error)
			return true
		}
		return false
	}

	public static isInvalidForDateSchema(payload: string, dateSchema: Joi.DateSchema): boolean {
		const { error } = dateSchema.validate(payload)
		if (error != null) {
			Logger.logger.warn("Validation failed", error)
			return true
		}
		return false
	}
}