import { BusinessTypeDbModel, IBusinessType } from "../db-models/business-type.db-model"
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { Logger } from "../logger"
import { BusinessType } from "../types/business-type"


export abstract class BusinessTypesService {

	public static async exists(businessTypeId: string): Promise<boolean> {
		try {
			return await BusinessTypeDbModel.BusinessTypeModel.exists({ _id: businessTypeId }).exec() != null
		} catch (err) {
			Logger.logger.error(`Failed to find business type by id ${businessTypeId}`, err)
			throw new DatabaseError(`Failed to find business type by id ${businessTypeId}`)
		}
	}

	public static async get(): Promise<BusinessType[]> {
		try {
			return (await BusinessTypeDbModel.BusinessTypeModel.find().exec()).map(bt => BusinessTypeDbModel.convertToDomainModel(bt))
		} catch (err) {
			Logger.logger.error("Failed to retrieve business types", err)
			throw new DatabaseError("Failed to retrieve business types")
		}
	}

	public static async getById(businessTypeId: string): Promise<BusinessType> {
		const businessTypeDoc = await BusinessTypesService.getBusinessTypeDocById(businessTypeId)

		if (businessTypeDoc == null) {
			Logger.logger.warn(`Business type ${businessTypeId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business type ${businessTypeId} doesn't exist`)
		}

		return BusinessTypeDbModel.convertToDomainModel(businessTypeDoc)
	}

	public static async getByIds(businessTypeIds: string[]): Promise<BusinessType[]> {
		return (await BusinessTypesService.getBusinessTypeDocsByIds(businessTypeIds)).map(bt => BusinessTypeDbModel.convertToDomainModel(bt))
	}

	private static async getBusinessTypeDocById(businessTypeId: string): Promise<IBusinessType> {
		try {
			return await BusinessTypeDbModel.BusinessTypeModel.findById(businessTypeId).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business type by id ${businessTypeId}`, err)
			throw new DatabaseError(`Failed to retrieve business type by id ${businessTypeId}`)
		}
	}

	private static async getBusinessTypeDocsByIds(businessTypeIds: string[]): Promise<IBusinessType[]> {
		const uniqueBusinessTypeIds = businessTypeIds.filter((bid, index, bids) => {
			return bids.indexOf(bid) == index
		})

		try {
			return await BusinessTypeDbModel.BusinessTypeModel.find({ _id: { $in: uniqueBusinessTypeIds }}).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business type by ids [${uniqueBusinessTypeIds.join(', ')}]`, err)
			throw new DatabaseError(`Failed to retrieve business type by ids [${uniqueBusinessTypeIds.join(', ')}]`)
		}
	}
}