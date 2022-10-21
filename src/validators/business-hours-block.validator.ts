import * as Joi from "joi"

import { BaseValidator } from "./base.validator"
import { DayOfTheWeek } from "../types/enums/day-of-the-week.enum"
import { BusinessHoursBlock } from "../types/business-hours-block"

export abstract class BusinessHoursBlockValidator extends BaseValidator {

	public static startAndEndTimesAreNotTheSame(businessHoursBlock: BusinessHoursBlock) {
		if (businessHoursBlock.startDayOfTheWeek == businessHoursBlock.endDayOfTheWeek &&
				businessHoursBlock.startHour == businessHoursBlock.endHour &&
				businessHoursBlock.startMinute == businessHoursBlock.endMinute) {
			throw new Error("start and end times cannot be the same")
		}
		return businessHoursBlock
	}

	public static readValidationSchema: Joi.ObjectSchema<BusinessHoursBlock> =
		Joi.object({
			startDayOfTheWeek: Joi.number().valid(...Object.values(DayOfTheWeek).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			startHour: Joi.number().integer().min(0).max(23).optional().allow(null),
			startMinute: Joi.number().integer().min(0).max(59).optional().allow(null),
			endDayOfTheWeek: Joi.number().valid(...Object.values(DayOfTheWeek).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			endHour: Joi.number().integer().min(0).max(23).optional().allow(null),
			endMinute: Joi.number().integer().min(0).max(59).optional().allow(null)
	})

	public static createOrUpdateValidationSchema: Joi.ObjectSchema<BusinessHoursBlock> =
		Joi.object({
			startDayOfTheWeek: Joi.number().valid(...Object.values(DayOfTheWeek).filter(v => Number.isInteger(v)))
				.required(),
			startHour: Joi.number().integer().min(0).max(23).required(),
			startMinute: Joi.number().integer().min(0).max(59).required(),
			endDayOfTheWeek: Joi.number().valid(...Object.values(DayOfTheWeek).filter(v => Number.isInteger(v)))
				.required(),
			endHour: Joi.number().integer().min(0).max(23).required(),
			endMinute: Joi.number().integer().min(0).max(59).required()
	})
		.custom(BusinessHoursBlockValidator.startAndEndTimesAreNotTheSame)

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessHoursBlock>(payload, BusinessHoursBlockValidator.readValidationSchema)
	}

	public static isInvalidForCreateOrUpdate(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessHoursBlock>(payload, BusinessHoursBlockValidator.createOrUpdateValidationSchema)
	}

}

