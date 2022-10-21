import * as Joi from "joi"

import { BusinessSettingObj } from "../types/business-setting"
import { BaseValidator } from "./base.validator"
import { IdValidator } from "./id.validator"


export abstract class ServiceBusinessSettingValidator extends BaseValidator {

	public static createAndUpdateValidationSchema: Joi.ObjectSchema<BusinessSettingObj> =
		Joi.object({
            setting: Joi.object().required()
		})
    
        public static isInvalidForCreateOrUpdate(payload: any): boolean {
            return BaseValidator.isInvalidForSchema<BusinessSettingObj>(payload, ServiceBusinessSettingValidator.createAndUpdateValidationSchema)
        }
}