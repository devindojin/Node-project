import { ServiceCategoryDbModel } from "../db-models/service-category.db-model"
import { ActionForbiddenError } from "../errors/action-forbidden.error"
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { ResourceAlreadyExistsError } from "../errors/resource-already-exists.error"
import { Logger } from "../logger"
import { ServiceCategory } from "../types/service-category"
import { BusinessServicesService } from "./business-services.service"
import { BusinessesService } from "./businesses.service"

export abstract class ServiceCategoriesSerice {

	public static async get(businessId: string): Promise<ServiceCategory[]> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)

		if (businessDoc == null) {
			Logger.logger.warn(`Business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} doesn't exist`)
		}

		return businessDoc.serviceCategories.map(sc => ServiceCategoryDbModel.convertToDomainModel(sc))
	}

	public static async getById(businessId: string, categoryId: string): Promise<ServiceCategory> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)
		const categoryDoc = businessDoc?.serviceCategories.find(sc => sc.id == categoryId)

		if (categoryDoc == null) {
			Logger.logger.warn(`Business ${businessId} or its service category ${categoryId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} or its service category ${categoryId} doesn't exist`)
		}

		return ServiceCategoryDbModel.convertToDomainModel(categoryDoc)
	}

	public static async create(businessId: string, serviceCategory: ServiceCategory): Promise<ServiceCategory> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)

		if (businessDoc == null) {
			Logger.logger.warn(`Business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} doesn't exist`)
		}

		if (businessDoc.serviceCategories.some(sc => sc.name.toLowerCase() == serviceCategory.name.toLowerCase())) {
			Logger.logger.warn(`Service category with name: '${serviceCategory.name}' already exists for business ${businessId}`)
			throw new ResourceAlreadyExistsError(`Service category with name: '${serviceCategory.name}' already exists for business ${businessId}`)
		}

		const serviceCategoryDoc = ServiceCategoryDbModel.convertToDbModel(serviceCategory)
		businessDoc.serviceCategories.push(serviceCategoryDoc)

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to create service category (name: '${serviceCategory.name}') for business ${businessId}`, err)
			throw new DatabaseError(`Failed to create service category (name: '${serviceCategory.name}') for business ${businessId}`)
		}

		return ServiceCategoryDbModel.convertToDomainModel(serviceCategoryDoc)
	}

	public static async update(businessId: string, serviceCategory: ServiceCategory): Promise<ServiceCategory> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)
		const categoryDoc = businessDoc?.serviceCategories.find(sc => sc.id == serviceCategory.id)

		if (categoryDoc == null) {
			Logger.logger.warn(`Business ${businessId} or its service category ${serviceCategory.id} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} or its service category ${serviceCategory.id} doesn't exist`)
		}

		if (categoryDoc.name == serviceCategory.name &&
				categoryDoc.description == serviceCategory.description) {
			return null
		}

		if (categoryDoc.name.toLowerCase() != serviceCategory.name.toLowerCase() &&
				businessDoc.serviceCategories.some(sc => sc.name.toLowerCase() == serviceCategory.name.toLowerCase())) {
			Logger.logger.warn(`Service category with name: '${serviceCategory.name}' already exists for business ${businessId}`)
			throw new ResourceAlreadyExistsError(`Service category with name: '${serviceCategory.name}' already exists for business ${businessId}`)
		}

		categoryDoc.name = serviceCategory.name
		categoryDoc.description = serviceCategory.description

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update service category ${serviceCategory.id}) for business ${businessId}`, err)
			throw new DatabaseError(`Failed to update service category ${serviceCategory.id}) for business ${businessId}`)
		}

		return ServiceCategoryDbModel.convertToDomainModel(categoryDoc)
	}

	public static async delete(businessId: string, categoryId: string): Promise<ServiceCategory> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)
		const categoryDoc = businessDoc?.serviceCategories.find(sc => sc.id == categoryId)

		if (categoryDoc == null) {
			Logger.logger.warn(`Business ${businessId} or its service category ${categoryId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} or its service category ${categoryId} doesn't exist`)
		}

		const servicesReferencingCategory = (await BusinessServicesService.get(businessId, false)).filter(s => s.category?.id == categoryId)

		if (servicesReferencingCategory.length > 0) {

			if (servicesReferencingCategory.filter(s => s.isActive == true).length > 0){
				Logger.logger.warn(`Category ${categoryId} for business ${businessId} cannot be deleted (is used by one or more service)`)
				throw new ActionForbiddenError(`Category ${categoryId} for business ${businessId} cannot be deleted (is used by one or more service)`)
			}

			const inactiveServicesReferencingCatgory = servicesReferencingCategory.filter(s => s.isActive == false)
			if (inactiveServicesReferencingCatgory.length > 0) {
				await BusinessServicesService.removeCategoryForBusinessServicesByIdForBusiness(businessId, inactiveServicesReferencingCatgory.map(s => s.id))
			}
		}

		businessDoc.serviceCategories.splice(businessDoc.serviceCategories.findIndex(sc => sc._id.toString() == categoryDoc._id.toString()), 1)

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to delete service category ${categoryId}) for business ${businessId}`, err)
			throw new DatabaseError(`Failed to delete service category ${categoryId}) for business ${businessId}`)
		}

		return ServiceCategoryDbModel.convertToDomainModel(categoryDoc)
	}

}