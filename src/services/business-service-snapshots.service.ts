import { BusinessServiceSnapshotDbModel, IBusinessServiceSnapshot } from "../db-models/business-service-snapshot.db-model"
import { DatabaseError } from "../errors/database.error"
import { Logger } from "../logger"
import { BusinessService } from "../types/business-service"
import { BusinessServiceSnapshot } from "../types/business-service-snapshot"

export abstract class BusinessServiceSnapshotsService {

	public static async getServiceSnapshotForService(businessService: BusinessService): Promise<BusinessServiceSnapshot> {

		const snapshotForService = await BusinessServiceSnapshotsService.getByHash(businessService.hash)

		if (snapshotForService != null) {
			return snapshotForService
		}

		return await this.createSnapshot(businessService)
	}

	public static async getById(snapshotId: string): Promise<BusinessServiceSnapshot> {
		let serviceSnapshotDoc: IBusinessServiceSnapshot

		try {
			serviceSnapshotDoc = await BusinessServiceSnapshotDbModel.BusinessServiceSnapshotModel.findById(snapshotId).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business service snapshot by id ${snapshotId}`, err)
			throw new DatabaseError(`Failed to retrieve business service snapshot by id ${snapshotId}`)
		}
		
		return BusinessServiceSnapshotDbModel.convertToDomainModel(serviceSnapshotDoc)
	}

	public static async getByIds(snapshotIds: string[]): Promise<BusinessServiceSnapshot[]> {
		const uniqueSnapshotIds = snapshotIds.filter((sid, index, sids) => {
			return sids.indexOf(sid) == index
		})
		
		let serviceSnapshotDocs: IBusinessServiceSnapshot[]

		try {
			serviceSnapshotDocs = await BusinessServiceSnapshotDbModel.BusinessServiceSnapshotModel.find({ _id: { $in: uniqueSnapshotIds}}).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business service snapshots by ids [${uniqueSnapshotIds.join(', ')}]`, err)
			throw new DatabaseError(`Failed to retrieve business service snapshots by ids [${uniqueSnapshotIds.join(', ')}]`)
		}
		
		return serviceSnapshotDocs.map(ss => BusinessServiceSnapshotDbModel.convertToDomainModel(ss))
	}

	private static async getByHash(serviceHash: string): Promise<BusinessServiceSnapshot> {
		let serviceSnapshotDoc: IBusinessServiceSnapshot

		try {
			serviceSnapshotDoc = await BusinessServiceSnapshotDbModel.BusinessServiceSnapshotModel.findOne({
				serviceHash: serviceHash
			}).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business service snapshot for hash ${serviceHash}`, err)
			throw new DatabaseError(`Failed to retrieve business service snapshot for hash ${serviceHash}`)
		}
		
		return serviceSnapshotDoc == null ? null : BusinessServiceSnapshotDbModel.convertToDomainModel(serviceSnapshotDoc)
	}

	private static async createSnapshot(businessService: BusinessService): Promise<BusinessServiceSnapshot> {

		const snapshotDoc = BusinessServiceSnapshotDbModel.convertToDbModel(new BusinessServiceSnapshot(
			null,
			businessService.hash,
			businessService.name,
			businessService.description,
			businessService.duration,
			businessService.durationUnit,
			businessService.price,
			businessService.currency))

		try {
			await BusinessServiceSnapshotDbModel.BusinessServiceSnapshotModel.create(snapshotDoc)
		} catch (err) {
			Logger.logger.error(`Failed to create business service snapshot for business service ${businessService.id}`, err)
			throw new DatabaseError(`Failed to create business service snapshot for business service ${businessService.id}`)
		}

		return  BusinessServiceSnapshotDbModel.convertToDomainModel(snapshotDoc)
	}
}