import * as Joi from "joi"

import { BusinessServiceSnapshot } from "../types/business-service-snapshot"
import { Currency } from "../types/enums/currency"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"


export abstract class BusinessServiceSnapshotValidator extends BaseValidator {

	public static readValidationSchema: Joi.ObjectSchema<BusinessServiceSnapshot> =
		Joi.object({
			id: IdValidator.readValidationSchema,
			serviceHash: Joi.string().hex().length(22).optional().allow(null),
			serviceName: Joi.string().trim().min(2).max(40).optional().allow(null),
			serviceDescription: Joi.string().trim().max(500).optional().allow(null),
			serviceDuration: Joi.number().integer().min(1).optional().allow(null),
			serviceDurationUnit: Joi.number().valid(...Object.values(DurationUnit).filter(v => Number.isInteger(v)))
				.optional().allow(null),
			servicePrice: Joi.number().integer().min(0).optional().allow(null),
			serviceCurrency: Joi.number().valid(...Object.values(Currency).filter(v => Number.isInteger(v)))
				.optional().allow(null)
		})

	public static isInvalidForRead(payload: any): boolean {
		return BaseValidator.isInvalidForSchema<BusinessServiceSnapshot>(payload, BusinessServiceSnapshotValidator.readValidationSchema)
	}

}