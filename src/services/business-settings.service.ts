
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { BusinessDbModel, IBusiness } from "../db-models/business.db-model"
import { IBusinessSetting } from "../db-models/business-setting.db-model"
import { Logger } from "../logger"
import { BusinessSettingObj } from "../types/business-setting"


export abstract class BusinessSettingService {

	public static async getById(businessId: string): Promise<IBusinessSetting> {
		const businessDoc = await BusinessSettingService.getBusinessDocById(businessId)

		if (businessDoc == null) {
			Logger.logger.warn(`Business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} doesn't exist`)
		}
        const business = businessDoc.setting;
		return business;
	}

    public static async update(businessId: string, body: BusinessSettingObj): Promise<BusinessSettingObj> {
		const businessDoc = await BusinessSettingService.getBusinessDocById(businessId);
        if (businessDoc == null) {
			Logger.logger.warn(`Business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} doesn't exist`)
		}

        businessDoc.setting = body.setting;

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update service business setting ${businessId}) for business ${businessId}`, err)
			throw new DatabaseError(`Failed to update service business setting ${businessId}) for business ${businessId}`)
		}

		return businessDoc.setting;
	}

	public static async getBusinessDocById(businessId: string): Promise<any> {
		try {
			return await BusinessDbModel.BusinessModel.findOne({ _id: businessId, activationToken: undefined, isDeleted: false }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business by id (${businessId})`, err)
			throw new DatabaseError(`Failed to retrieve business by id (${businessId})`)
		}
	}
}