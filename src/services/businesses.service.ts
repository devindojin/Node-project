import * as bcrypt from "bcrypt"
import { Document } from "mongoose"

import { AddressDbModel } from "../db-models/address.db-model"
import { BusinessHoursBlockDbModel, IBusinessHoursBlock } from "../db-models/business-hours-block.db-model"
import { BusinessDbModel, IBusiness } from "../db-models/business.db-model"
import { CoordinatesDbModel } from "../db-models/coordinates.db-model"
import { BadRequestError } from "../errors/bad-request.error"
import { DatabaseError } from "../errors/database.error"
import { ReferencedResourceNotFoundError } from "../errors/referenced-resource-not-found.error"
import { ResourceAlreadyExistsError } from "../errors/resource-already-exists.error"
import { Logger } from "../logger"
import { Business } from "../types/business"
import { BusinessHoursBlock } from "../types/business-hours-block"
import { Currency } from "../types/enums/currency"
import { TimeZone } from "../types/enums/time-zone.enum"
import { BusinessServicesService } from "./business-services.service"
import { BusinessTypesService } from "./business-types.service"
import { EmailService } from "./email.service"


export abstract class BusinessesService {

	public static async exists(businessId: string): Promise<boolean> {
		try {
			return await BusinessDbModel.BusinessModel.exists({ _id: businessId, activationToken: undefined, isDeleted: false }).exec() != null
		} catch (err) {
			Logger.logger.error(`Failed to find business ${businessId}`, err)
			throw new DatabaseError(`Failed to find business ${businessId}`)
		}
	}

	public static async getById(businessId: string, hydrate = true): Promise<Business> {
		const businessDoc = await BusinessesService.getBusinessDocById(businessId)

		if (businessDoc == null) {
			Logger.logger.warn(`Business ${businessId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} doesn't exist`)
		}

		const business = BusinessDbModel.convertToDomainModel(businessDoc)
		if (hydrate == true) {
			await BusinessesService.hydrateBusiness(business)
		}
		return business
	}

	public static async getByIds(businessIds: string[], excludeDeleted = true): Promise<Business[]> {
		return (await BusinessesService.getBusinessDocsByIds(businessIds, excludeDeleted)).map(bd => BusinessDbModel.convertToDomainModel(bd))
	}

	// this method does not delete operator's password as it is used by auth service!
	public static async getByEmail(email: string): Promise<IBusiness> {
		let businessDoc: IBusiness

		try {
			businessDoc = await BusinessDbModel.BusinessModel.findOne({ email: email.toLowerCase(), activationToken: undefined, isDeleted: false }).exec()
		} catch (err) {
			Logger.logger.error("Failed to get business by e-mail", err)
			throw new DatabaseError("Failed to get business by e-mail")
		}

		return businessDoc
	}

	public static async getBySlug(slug: string, hydrate = true): Promise<Business> {
		let businessDoc: IBusiness

		try {
			businessDoc = await BusinessDbModel.BusinessModel.findOne({ slug: slug.toLowerCase(), activationToken: undefined, isDeleted: false }).exec()
		} catch (err) {
			Logger.logger.error("Failed to get business by slug", err)
			throw new DatabaseError("Failed to get business by slug")
		}

		if (businessDoc == null) {
			return null
		}

		const business = BusinessDbModel.convertToDomainModel(businessDoc)
		delete business.email
		delete business.type
		delete business.isActive
		delete business.isDeleted

		if (hydrate == true) {
			await BusinessesService.hydrateBusiness(business)
		}

		return business
	}

	public static async getAll(city: string, country: string, businessType: string = '', hydrate = true): Promise<Business[]> {
		let businesses: Business[] = []
		let businessDoc: IBusiness[]

		try {
			if (businessType) {
				businessDoc = await BusinessDbModel.BusinessModel.find({ 'businessTypeId': businessType, 'address.city': city, 'address.country': country, activationToken: undefined, isDeleted: false, isActive: true }).exec()

			}else {
				businessDoc = await BusinessDbModel.BusinessModel.find({ 'address.city': city, 'address.country': country, activationToken: undefined, isDeleted: false, isActive: true }).exec()

			}
		} catch (err) {
			Logger.logger.error("Failed to get business by slug", err)
			throw new DatabaseError("Failed to get business by slug")
		}

		if (businessDoc == null) {
			return null
		}

		for await (const b of businessDoc) {	
			const business = BusinessDbModel.convertToDomainModel(b)
			delete business.email
			delete business.type
			delete business.isActive
			delete business.isDeleted
	
			await BusinessesService.hydrateBusiness(business)
			businesses.push(business);
		}
		
		return businesses
	}

	public static async create(business: Business): Promise<Business> {

		if (await BusinessesService.getByEmail(business.email) != null) {
			Logger.logger.warn(`Business with email: '${business.email}' already exists`)
			throw new ResourceAlreadyExistsError(`Business with email: '${business.email}' already exists`)
		}

		try {
			business.password = await bcrypt.hash(business.password, 11)
		} catch (err) {
			Logger.logger.error(`Failed to hash password when creating business (email: '${business.email}')`, err)
			throw Error(`Failed to hash password when creating a new business (email: '${business.email}')`)
		}

		business.name = null
		business.slug = null
		business.phoneNumber = null
		business.address = null
		business.type = null
		business.timeZone = TimeZone.Chile_Continental
		business.currency = Currency.CLP
		business.isOperatingNonStop = true
		business.businessHoursBlocks = null
		business.about = null
		business.services = null
		business.serviceCategories = null
		business.isActive = true
		business.isDeleted = false

		const businessDoc = BusinessDbModel.convertToDbModel(business)
		businessDoc.activationToken = new Object() as Document

		try {
			await BusinessDbModel.BusinessModel.create(businessDoc)
		} catch (err) {
			Logger.logger.error(`Failed to create business (email: '${business.email}')`, err)
			throw new DatabaseError(`Failed to create business (email: '${business.email}')`)
		}

		try {
			await EmailService.sendAccountActivationToBusiness(businessDoc)
		} catch {}

		return BusinessDbModel.convertToDomainModel(businessDoc)
	}

	// public static async update(business: Business): Promise<Business> {

	// 	const currentBusinessDoc = await BusinessesService.getBusinessDocById(business.id)

	// 	if (currentBusinessDoc == null) {
	// 		Logger.logger.warn(`Business ${business.id} doesn't exist`)
	// 		throw new ReferencedResourceNotFoundError(`Business ${business.id} doesn't exist`)
	// 	}

	// 	if (business.password == null &&
	// 			business.name == currentBusinessDoc.name &&
	// 			business.email.toLowerCase() == currentBusinessDoc.email &&
	// 			business.timeZone == currentBusinessDoc.timeZone &&
	// 			business.slug.toLowerCase() == currentBusinessDoc.slug &&
	// 			business.phoneNumber == currentBusinessDoc.phoneNumber &&
	// 			business.address.line1 == currentBusinessDoc.address.line1 &&
	// 			business.address.line2 == currentBusinessDoc.address.line2 &&
	// 			business.address.line3 == currentBusinessDoc.address.line3 &&
	// 			business.address.town == currentBusinessDoc.address.town &&
	// 			business.bookableTimeBlockLength == currentBusinessDoc.bookableTimeBlockLength &&
	// 			business.bookableTimeBlockUnit == currentBusinessDoc.bookableTimeBlockUnit &&
	// 			business.about == currentBusinessDoc.about) {
	// 		return null
	// 	}

	// 	if (business.email.toLowerCase() != currentBusinessDoc.email) {
	// 		if (await BusinessesService.getByEmail(business.email) != null) {
	// 			Logger.logger.warn(`Business with email: '${business.email}' already exists`)
	// 			throw new ResourceAlreadyExistsError(`Business with email: '${business.email}' already exists`)
	// 		}
	// 	}

	// 	if (business.slug.toLowerCase() != currentBusinessDoc.slug) {
	// 		if (await BusinessesService.getBySlug(business.slug) != null) {
	// 			Logger.logger.warn(`Business with slug: '${business.slug}' already exists`)
	// 			throw new ResourceAlreadyExistsError(`Business with slug: '${business.slug}' already exists`)
	// 		}
	// 	}

	// 	if (business.password != null) {
	// 		try {
	// 			currentBusinessDoc.password = await bcrypt.hash(business.password, 11)
	// 		} catch (err) {
	// 			Logger.logger.error(`Failed to hash password when updating business ${business.id}`, err)
	// 			throw Error(`Failed to hash password when updating a new business ${business.id}`)
	// 		}
	// 	}

	// 	currentBusinessDoc.name = business.name
	// 	currentBusinessDoc.slug = business.slug
	// 	currentBusinessDoc.phoneNumber = business.phoneNumber
	// 	currentBusinessDoc.address = AddressDbModel.convertToDbModel(business.address)
	// 	currentBusinessDoc.email = business.email
	// 	currentBusinessDoc.timeZone = business.timeZone
	// 	currentBusinessDoc.bookableTimeBlockLength = business.bookableTimeBlockLength
	// 	currentBusinessDoc.bookableTimeBlockUnit = business.bookableTimeBlockUnit
	// 	currentBusinessDoc.about = business.about

	// 	try {
	// 		await currentBusinessDoc.save()
	// 	} catch (err) {
	// 		Logger.logger.error(`Failed to update business ${business.id}`, err)
	// 		throw new DatabaseError(`Failed to update business ${business.id}`)
	// 	}

	// 	return BusinessDbModel.convertToDomainModel(currentBusinessDoc)
	// }

	public static async partialUpdate(business: Business): Promise<Business> {

		const currentBusinessDoc = await BusinessesService.getBusinessDocById(business.id)

		if (currentBusinessDoc == null) {
			Logger.logger.warn(`Business ${business.id} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${business.id} doesn't exist`)
		}

		let resourceNotModified = true

		if (business.email != null && business.email.toLowerCase() != currentBusinessDoc.email) {
			if (await BusinessesService.getByEmail(business.email) != null) {
				Logger.logger.warn(`Business with email: '${business.email}' already exists`)
				throw new ResourceAlreadyExistsError(`Business with email: '${business.email}' already exists`)
			}

			currentBusinessDoc.email = business.email
			resourceNotModified = false
		}

		if (business.slug != null && business.slug.toLowerCase() != currentBusinessDoc.slug) {
			if (await BusinessesService.getBySlug(business.slug) != null) {
				Logger.logger.warn(`Business with slug: '${business.slug}' already exists`)
				throw new ResourceAlreadyExistsError(`Business with slug: '${business.slug}' already exists`)
			}

			currentBusinessDoc.slug = business.slug
			resourceNotModified = false
		}

		if (business.type != null && business.type.id != currentBusinessDoc.businessTypeId) {
			await BusinessTypesService.getById(business.type.id)
			currentBusinessDoc.businessTypeId = business.type.id
			resourceNotModified = false
		}

		if (business.phoneNumber != null && business.phoneNumber != currentBusinessDoc.phoneNumber) {
			currentBusinessDoc.phoneNumber = business.phoneNumber
			resourceNotModified = false
		}

		if (business.address != null && (
				business.address.address != currentBusinessDoc.address?.address ||
				business.address.city != currentBusinessDoc.address?.city ||
				business.address.country != currentBusinessDoc.address?.country)) {
			currentBusinessDoc.address = AddressDbModel.convertToDbModel(business.address)
			resourceNotModified = false
		}

		if (business.coordinates != null) {
			if (business.coordinates.latitude == 0 && business.coordinates.longitude == 0) {
				business.coordinates = undefined
			}
			if (business.coordinates?.latitude != currentBusinessDoc.coordinates?.latitude ||
					business.coordinates?.longitude != currentBusinessDoc.coordinates?.longitude) {
				if (business.coordinates == undefined) {
					currentBusinessDoc.coordinates = business.coordinates
				} else {
					currentBusinessDoc.coordinates = CoordinatesDbModel.convertToDomainModel(business.coordinates)
				}
				resourceNotModified = false
			}
		}

		if (business.password != null) {
			try {
				currentBusinessDoc.password = await bcrypt.hash(business.password, 11)
			} catch (err) {
				Logger.logger.error(`Failed to hash password when partially updating business ${business.id}`, err)
				throw Error(`Failed to hash password when partially updating a new business ${business.id}`)
			}

			resourceNotModified = false
		}

		if (business.isOperatingNonStop != null && business.isOperatingNonStop != currentBusinessDoc.isOperatingNonStop) {
			currentBusinessDoc.isOperatingNonStop = business.isOperatingNonStop
			resourceNotModified = false
		}

		if (business.businessHoursBlocks != null) {
			if (business.businessHoursBlocks.length == 0) {
				business.businessHoursBlocks = undefined
			}
			if (BusinessesService.areBusinessHoursBlocksNotEqual(business.businessHoursBlocks, currentBusinessDoc.businessHoursBlocks)) {
				if (business.businessHoursBlocks == undefined) {
					currentBusinessDoc.businessHoursBlocks = business.businessHoursBlocks
				} else {
					BusinessesService.checkBusinessHoursBlocksAreValid(business.businessHoursBlocks)
					currentBusinessDoc.businessHoursBlocks = business.businessHoursBlocks.map(bh => BusinessHoursBlockDbModel.convertToDbModel(bh))
				}
				resourceNotModified = false
			}
		}

		if (business.timeZone != null && business.timeZone != currentBusinessDoc.timeZone) {
			currentBusinessDoc.timeZone = business.timeZone
			resourceNotModified = false
		}

		if (business.currency != null && business.currency != currentBusinessDoc.currency) {
			currentBusinessDoc.currency = business.currency
			resourceNotModified = false
		}

		if (business.name != null && business.name != currentBusinessDoc.name) {
			currentBusinessDoc.name = business.name
			resourceNotModified = false
		}

		if (business.about != null) {
			if (business.about == '') {
				business.about = undefined
			}
			if (business.about != currentBusinessDoc.about) {
				currentBusinessDoc.about = business.about
				resourceNotModified = false
			}
		}

		if (resourceNotModified == true) {
			return null
		}

		try {
			await currentBusinessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to partially update business ${business.id}`, err)
			throw new DatabaseError(`Failed to partially update business ${business.id}`)
		}

		return BusinessDbModel.convertToDomainModel(currentBusinessDoc)
	}

	public static async createPasswordResetToken(email: string): Promise<void> {

		const businessDoc = await BusinessesService.getByEmail(email)

		if (businessDoc == null) {
			return
		}

		businessDoc.passwordResetToken = new Object() as Document

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to save password reset token for business ${businessDoc._id.toString()}`, err)
			throw new DatabaseError(`Failed to save password reset token for business ${businessDoc._id.toString()}`)
		}

		try {
			await EmailService.sendPasswordResetToBusiness(businessDoc)
		} catch {}
	}

	public static async resetPassword(newPassword: string, businessId: string, passwordResetTokenId: string): Promise<void> {

		const businessDoc = await BusinessesService.getBusinessDocById(businessId)

		if (businessDoc?.passwordResetToken?._id.toString() != passwordResetTokenId) {
			Logger.logger.warn(`Business ${businessId} or its password reset token ${passwordResetTokenId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} or its password reset token ${passwordResetTokenId} doesn't exist`)
		}

		const tokenExpiryDate = new Date(businessDoc.passwordResetToken._id.getTimestamp())
		tokenExpiryDate.setHours(tokenExpiryDate.getHours() + 1)

		if (tokenExpiryDate < new Date()) {

			businessDoc.passwordResetToken = undefined

			try {
				await businessDoc.save()
			} catch (err) {
				Logger.logger.error(`Failed to save password reset token for business ${businessDoc._id.toString()}`, err)
				throw new DatabaseError(`Failed to save password reset token for business ${businessDoc._id.toString()}`)
			}

			Logger.logger.warn(`Password reset token ${passwordResetTokenId} for business ${businessId} is expired`)
			throw new ReferencedResourceNotFoundError(`Password reset token ${passwordResetTokenId} for business ${businessId} is expired`)
		}

		try {
			businessDoc.password = await bcrypt.hash(newPassword, 11)
		} catch (err) {
			Logger.logger.error(`Failed to hash new password when resetting password for business ${businessId}`, err)
			throw Error(`Failed to hash new password when resetting password for business ${businessId}`)
		}

		businessDoc.passwordResetToken = undefined

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to save new password for business ${businessDoc._id.toString()}`, err)
			throw new DatabaseError(`Failed to save new password for business ${businessDoc._id.toString()}`)
		}
	}

	public static async activateAccount(businessId: string, activationTokenId: string): Promise<void> {
		let businessDoc: IBusiness

		try {
			businessDoc = await BusinessDbModel.BusinessModel.findById(businessId).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business by id (${businessId})`, err)
			throw new DatabaseError(`Failed to retrieve business by id (${businessId})`)
		}

		if (businessDoc?.activationToken?._id.toString() != activationTokenId) {
			Logger.logger.warn(`Business ${businessId} or its activation token ${activationTokenId} doesn't exist`)
			throw new ReferencedResourceNotFoundError(`Business ${businessId} or its activation token ${activationTokenId} doesn't exist`)
		}

		businessDoc.activationToken = undefined

		try {
			await businessDoc.save()
		} catch (err) {
			Logger.logger.error(`Failed to update business ${businessDoc._id.toString()} when activating account`, err)
			throw new DatabaseError(`Failed to update business ${businessDoc._id.toString()} when activating account`)
		}
	}

	public static async getBusinessDocById(businessId: string): Promise<IBusiness> {
		try {
			return await BusinessDbModel.BusinessModel.findOne({ _id: businessId, activationToken: undefined, isDeleted: false }).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business by id (${businessId})`, err)
			throw new DatabaseError(`Failed to retrieve business by id (${businessId})`)
		}
	}

	private static async getBusinessDocsByIds(businessIds: string[], excludeDeleted = true): Promise<IBusiness[]> {
		const uniqueBusinessIds = businessIds.filter((bid, index, bids) => {
			return bids.indexOf(bid) == index
		})

		const filter = {
			_id: { $in: uniqueBusinessIds},
			activationToken: undefined
		}

		if (excludeDeleted == true) {
			(filter as any).isDeleted = false
		}

		try {
			return await BusinessDbModel.BusinessModel.find(filter).exec()
		} catch (err) {
			Logger.logger.error(`Failed to retrieve business by ids [${uniqueBusinessIds.join(', ')}`, err)
			throw new DatabaseError(`Failed to retrieve business by ids [${uniqueBusinessIds.join(', ')}`)
		}
	}

	private static async hydrateBusiness(business: Business): Promise<void> {
		const services = await BusinessServicesService.get(business.id)
		business.services = services.length == 0 ? undefined : services
		business.type = business.type == null ? undefined : await BusinessTypesService.getById(business.type.id)
	}

	private static areBusinessHoursBlocksNotEqual(businessHoursBlockA: BusinessHoursBlock[], businessHoursBlockB: IBusinessHoursBlock[]) {
		if (businessHoursBlockA == null && businessHoursBlockB == null) {
			return false
		}

		if (businessHoursBlockA != null && businessHoursBlockB == null ||
				businessHoursBlockB != null && businessHoursBlockA == null ||
				businessHoursBlockA.length != businessHoursBlockB.length) {
			return true
		}

		if (businessHoursBlockA.every(bhba => businessHoursBlockB.some(bhbb =>
				bhba.startDayOfTheWeek == bhbb.startDayOfTheWeek &&
				bhba.startHour == bhbb.startHour &&
				bhba.startMinute == bhbb.startMinute &&
				bhba.endDayOfTheWeek == bhbb.endDayOfTheWeek &&
				bhba.endHour == bhbb.endHour &&
				bhba.endMinute == bhbb.endMinute))) {
			return false
		}
		
		return true
	}

	private static checkBusinessHoursBlocksAreValid(businessHoursBlocks: BusinessHoursBlock[]): void {
		BusinessesService.checkBusinessHoursBlocksAreNotOverlapping(businessHoursBlocks)
	}

	private static checkBusinessHoursBlocksAreNotOverlapping(businessHoursBlocks: BusinessHoursBlock[]): void {
		for (let i = 0; i < businessHoursBlocks.length; i++) {
			const businessHoursBlockA = businessHoursBlocks[i]
			const businessHoursBlockAStartInt = businessHoursBlockA.getStartTimeInteger()
			const businessHoursBlockAEndInt = businessHoursBlockA.getEndTimeInteger()
			
			for (let j = 0; j < businessHoursBlocks.length; j++) {
				if (i == j) {
					continue
				}
				const businessHoursBlockB = businessHoursBlocks[j]
				const businessHoursBlockBStartInt = businessHoursBlockB.getStartTimeInteger()
				const businessHoursBlockBEndInt = businessHoursBlockB.getEndTimeInteger()

				if (businessHoursBlockAEndInt > businessHoursBlockAStartInt) {
					if ((businessHoursBlockBStartInt >= businessHoursBlockAStartInt && businessHoursBlockBStartInt <= businessHoursBlockAEndInt) ||
							(businessHoursBlockBEndInt >= businessHoursBlockAStartInt && businessHoursBlockBEndInt <= businessHoursBlockAEndInt)) {
						Logger.logger.warn(`businessHoursBlocks[${i}] overlaps with businessHoursBlocks[${j}]`)
						throw new BadRequestError(`businessHoursBlocks[${i}] overlaps with businessHoursBlocks[${j}]`)
					}
				} else {
					if ((businessHoursBlockBStartInt >= businessHoursBlockAStartInt && businessHoursBlockBStartInt <= 62359) ||
							(businessHoursBlockBStartInt >= 0 && businessHoursBlockBStartInt <= businessHoursBlockAEndInt) ||
							(businessHoursBlockBEndInt >= businessHoursBlockAStartInt && businessHoursBlockBEndInt <= 62359) ||
							(businessHoursBlockBEndInt >= 0 && businessHoursBlockBEndInt <= businessHoursBlockAEndInt)) {
						Logger.logger.warn(`businessHoursBlocks[${i}] overlaps with businessHoursBlocks[${j}]`)
						throw new BadRequestError(`businessHoursBlocks[${i}] overlaps with businessHoursBlocks[${j}]`)
					}
				}
			}
		}
	}

}
