import { BusinessServiceDbModel, IBusinessService } from "../db-models/business-service.model"
import { BadRequestError } from "../errors/bad-request.error"
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { ResourceAlreadyExistsError } from "../errors/resource-already-exists.error"
import { Logger } from "../logger"
import { BusinessService } from "../types/business-service"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { ServiceCategoriesSerice } from "./service-categories.service"


export abstract class BusinessServicesService {

	public static async getById(businessId: string, serviceId: string, hydrate = true): Promise<BusinessService> {
		const serviceDoc = await BusinessServicesService.getBusinessServiceDocById(serviceId, businessId)

		if (serviceDoc == null) {
			Logger.logger.warn(`Service ${serviceId} doesn't exist for business ${businessId}`)
			throw new ReferencedResourceNotFoundError(`Service ${serviceId} doesn't exist for business ${businessId}`)
		}

		const service = BusinessServiceDbModel.convertToDomainModel(serviceDoc)
		if (hydrate == true) {
			await BusinessServicesService.hydrateBusinessServices(businessId, [service])
		}
		return service
	}

	public static async getByIds(serviceIds: string[], excludeDeleted = true): Promise<BusinessService[]> {
		return (await BusinessServicesService.getBusinessServiceDocsByIds(serviceIds, excludeDeleted)).map(bs => BusinessServiceDbModel.convertToDomainModel(bs))
	}

	public static async get(businessId: string, hydrate = true): Promise<BusinessService[]> {
		const services = (await BusinessServicesService.getBusinessServiceDocsForbusiness(businessId))
			.map(s => BusinessServiceDbModel.convertToDomainModel(s))
		if (hydrate == true) {
			await BusinessServicesService.hydrateBusinessServices(businessId, services)
		}
		return services
	}

	public static async create(businessId: string, businessService: BusinessService): Promise<BusinessService> {

		const referencedServiceCategory = businessService.category == null ?
			undefined :
			await ServiceCategoriesSerice.getById(businessId, businessService.category.id)

		const services = await BusinessServicesService.get(businessId)

		if (services.some(s => s.name.toLowerCase() == businessService.name.toLowerCase())) {
			Logger.logger.info(`Referenced business ${businessId} already contains service called "${businessService.name}"`)
			throw new ResourceAlreadyExistsError(`Referenced business ${businessId} already contains service called "${businessService.name}"`)
		}

		if (businessService.durationUnit == DurationUnit.Minute && businessService.duration < 5) {
			Logger.logger.warn("Service duration cannot be shorter than 5 minutes")
			throw new BadRequestError("Service duration cannot be shorter than 5 minutes")
		}

		if (businessService.price == null) {
			businessService.price = 0
		}

		businessService.calculateHash()
		businessService.isActive = true
		businessService.isDeleted = false

		const businessServiceDoc = BusinessServiceDbModel.convertToDbModel(businessId, businessService)

		try {
			await BusinessServiceDbModel.BusinessServiceModel.create(businessServiceDoc)
		} catch (err) {
			Logger.logger.error(`Failed to save business ${businessId} while creating business service (name: '${businessService.name}')`, err)
			throw new DatabaseError(`Failed to save business ${businessId} while creating business service (name: '${businessService.name}')`)
		}

		const newBusinessService = BusinessServiceDbModel.convertToDomainModel(businessServiceDoc)
		newBusinessService.category = referencedServiceCategory
		return newBusinessService
	}

	public static async update(businessId: string, businessService: BusinessService): Promise<BusinessService> {
		const serviceDocs = await BusinessServicesService.getBusinessServiceDocsForbusiness(businessId)
		const referencedServiceDoc = serviceDocs.find(s => s.id == businessService.id)

		if (referencedServiceDoc == null) {
			Logger.logger.warn(`Service ${businessService.id} for business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Service ${businessService.id} for business ${businessId} doesn't exist`)
		}

		if (businessService.name == referencedServiceDoc.name &&
				businessService.description == referencedServiceDoc.description &&
				businessService.category?.id == referencedServiceDoc.categoryId &&
				businessService.duration == referencedServiceDoc.duration &&
				businessService.durationUnit == referencedServiceDoc.durationUnit &&
				businessService.price == referencedServiceDoc.price &&
				businessService.currency == referencedServiceDoc.currency &&
				businessService.isActive == referencedServiceDoc.isActive) {
			return null
		}

		if (businessService.durationUnit == DurationUnit.Minute && businessService.duration < 5) {
			Logger.logger.warn("Service duration cannot be shorter than 5 minutes")
			throw new BadRequestError("Service duration cannot be shorter than 5 minutes")
		}

		if (businessService.name.toLowerCase() != referencedServiceDoc.name.toLowerCase() &&
				serviceDocs.some(s => s.name.toLowerCase() == businessService.name.toLowerCase())) {
			Logger.logger.info(`Referenced business ${businessId} already contains service called "${businessService.name}"`)
			throw new ResourceAlreadyExistsError(`Referenced business ${businessId} already contains service called "${businessService.name}"`)
		}

		const referencedServiceCategory = businessService.category == null ?
			undefined :
			await ServiceCategoriesSerice.getById(businessId, businessService.category.id)

		businessService.calculateHash()

		referencedServiceDoc.name = businessService.name
		referencedServiceDoc.description = businessService.description
		referencedServiceDoc.categoryId = businessService.category?.id
		referencedServiceDoc.duration = businessService.duration
		referencedServiceDoc.durationUnit = businessService.durationUnit
		referencedServiceDoc.price = businessService.price
		referencedServiceDoc.currency = businessService.currency
		referencedServiceDoc.isActive = businessService.isActive
		referencedServiceDoc.hash = businessService.hash

		try {
			await referencedServiceDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update business service ${businessService.id} for business ${businessId}`, err)
			throw new DatabaseError(`Failed to update business service ${businessService.id} for business ${businessId}`)
		}

		const newBusinessService = BusinessServiceDbModel.convertToDomainModel(referencedServiceDoc)
		newBusinessService.category = referencedServiceCategory
		return newBusinessService
	}

	public static async delete(businessId: string, serviceId: string, hydrate = true): Promise<BusinessService> {
		const serviceDoc = await BusinessServicesService.getBusinessServiceDocById(serviceId, businessId)

		if (serviceDoc == null) {
			Logger.logger.warn(`Service ${serviceId} doesn't exist for business ${businessId}`)
			throw new ReferencedResourceNotFoundError(`Service ${serviceId} doesn't exist for business ${businessId}`)
		}

		serviceDoc.isDeleted = true

		try {
			await serviceDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to mark business service ${serviceId} for business ${businessId} as deleted`, err)
			throw new DatabaseError(`Failed to mark business service ${serviceId} for business ${businessId} as deleted`)
		}

		const service = BusinessServiceDbModel.convertToDomainModel(serviceDoc)
		if (hydrate == true) {
			await BusinessServicesService.hydrateBusinessServices(businessId, [service])
		}
		return service
	}

	public static async removeCategoryForBusinessServicesByIdForBusiness(businessId: string, businessServicesIds: string[]): Promise<void> {

		try {
			await BusinessServiceDbModel.BusinessServiceModel.updateMany({
					_id: { $in: businessServicesIds },
					businessId: businessId
				},{
					$unset: { categoryId: false }
				}).exec()
		} catch (err) {
			Logger.logger.error(`Failed to remove categories for business services [${businessServicesIds.join(', ')}] for business ${businessId}`, err)
			throw new DatabaseError(`Failed to remove categories for business services [${businessServicesIds.join(', ')}] for business ${businessId}`)
		}
	}

	public static async getBusinessServiceDocById(serviceId: string, businessId: string): Promise<IBusinessService> {
		try {
			return await BusinessServiceDbModel.BusinessServiceModel.findOne({ _id: serviceId, businessId: businessId, isDeleted: false }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business service ${serviceId} for business ${businessId}`, err)
			throw new DatabaseError(`Failed to retrieve business service ${serviceId} for business ${businessId}`)
		}
	}

	private static async getBusinessServiceDocsByIds(serviceIds: string[], excludeDeleted = true): Promise<IBusinessService[]> {
		const uniqueServiceIds = serviceIds.filter((sid, index, sids) => {
			return sids.indexOf(sid) == index
		})

		const filter = { _id: { $in: uniqueServiceIds}}

		if (excludeDeleted == true) {
			(filter as any).isDeleted = false
		}

		try {
			return await BusinessServiceDbModel.BusinessServiceModel.find(filter).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business services by ids [${uniqueServiceIds.join(', ')}]`, err)
			throw new DatabaseError(`Failed to retrieve business services by ids [${uniqueServiceIds.join(', ')}]`)
		}

	}

	private static async getBusinessServiceDocsForbusiness(businessId: string, excludeDeleted = true): Promise<IBusinessService[]> {
		let serviceDocs: IBusinessService[]

		const filter = { businessId: businessId }

		if (excludeDeleted == true) {
			(filter as any).isDeleted = false
		}

		try {
			serviceDocs = await BusinessServiceDbModel.BusinessServiceModel.find(filter).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business services for business ${businessId}`, err)
			throw new DatabaseError(`Failed to retrieve business services for business ${businessId}`)
		}

		return serviceDocs
	}

	private static async hydrateBusinessServices(businessId: string, businessServices: BusinessService[]): Promise<void> {
		const categoriesForBusiness = await ServiceCategoriesSerice.get(businessId)
		for (const businessService of businessServices) {
			businessService.category = businessService.category == null ? undefined : categoriesForBusiness.find(c => c.id == businessService.category.id)
		}
	}

}