import { Schema, Document, model } from "mongoose"

import { BusinessType } from "../types/business-type"
import { Business } from "../types/business"
import { BusinessSetting } from "../types/business-setting"
import { AddressDbModel, IAddress } from "./address.db-model"
import { TimeZone } from "../types/enums/time-zone.enum"
import { BusinessHoursBlockDbModel, IBusinessHoursBlock } from "./business-hours-block.db-model"
import { Currency } from "../types/enums/currency"
import { CoordinatesDbModel, ICoordinates } from "./coordinates.db-model"
import { IServiceCategoryType, ServiceCategoryDbModel } from "./service-category.db-model"
import { BusinessSettingDbModel, IBusinessSetting } from "./business-setting.db-model"

export abstract class BusinessDbModel {

	private static businessSchema = new Schema({
		name: String,
		slug: {
			type: String,
			lowercase: true,
			index: {
				unique: true,
				partialFilterExpression: { slug: { $type: 'string' }}
			}
		},
		phoneNumber: String,
		address: AddressDbModel.addressSchema,
		coordinates: CoordinatesDbModel.coordinatesSchema,
		email: {
			type: String,
			unique: true,
			lowercase: true
		},
		password: String,
		businessTypeId: String,
		timeZone: {
			type: String,
			enum: Object.values(TimeZone)
		},
		currency: {
			type: Number,
			enum: Object.values(Currency).filter(v => Number.isInteger(v))
		},
		isOperatingNonStop: Boolean,
		businessHoursBlocks: [ BusinessHoursBlockDbModel.businessHoursBlockSchema ],
		about: String,
		serviceCategories: [ ServiceCategoryDbModel.serviceCategorySchema ],
		setting: BusinessSettingDbModel.businessSettingSchema,
		isActive: Boolean,
		isDeleted: Boolean,
		passwordResetToken: new Schema({}),
		activationToken: new Schema({})
	})

	public static BusinessModel = model<IBusiness>('business', BusinessDbModel.businessSchema)

	public static convertToDbModel(business: Business): IBusiness {
		return new BusinessDbModel.BusinessModel({
			name: business.name == null ?
				undefined :
				business.name,
			slug: business.slug == null ?
				undefined :
				business.slug,
			phoneNumber: business.phoneNumber == null ?
				undefined :
				business.phoneNumber,
			address: business.address == null ?
				undefined :
				AddressDbModel.convertToDbModel(business.address),
			coordinates: business.coordinates == null ?
				undefined :
				CoordinatesDbModel.convertToDbModel(business.coordinates),
			email: business.email,
			password: business.password,
			businessTypeId: business.type == null ?
				undefined :
				business.type.id,
			timeZone: business.timeZone,
			currency: business.currency,
			isOperatingNonStop: business.isOperatingNonStop == null ?
				undefined :
				business.isOperatingNonStop,
			businessHoursBlocks: business.businessHoursBlocks == null ?
				undefined :
				business.businessHoursBlocks.map(bh => BusinessHoursBlockDbModel.convertToDbModel(bh)),
			about: business.about == null ?
				undefined :
				business.about,
			serviceCategories: business.serviceCategories == null || business.serviceCategories.length == 0 ?
				undefined :
				business.serviceCategories.map(sc => ServiceCategoryDbModel.convertToDbModel(sc)),
			setting: business.setting == null ?
				undefined :
				BusinessSettingDbModel.convertToDbModel(business.setting),
			isActive: business.isActive == null ?
				undefined :
				business.isActive,
			isDeleted: business.isDeleted == null ?
				undefined :
				business.isDeleted
		})
	}

	public static convertToDomainModel(businessDoc: IBusiness): Business {
		const business = new Business(
			businessDoc.id.toString(),
			businessDoc.name == null ?
				undefined :
				businessDoc.name,
			businessDoc.slug == null ?
				undefined :
				businessDoc.slug,
			businessDoc.phoneNumber == null ?
				undefined :
				businessDoc.phoneNumber,
			businessDoc.address == null ?
				undefined :
				AddressDbModel.convertToDomainModel(businessDoc.address),
			businessDoc.coordinates == null ?
				undefined :
				CoordinatesDbModel.convertToDomainModel(businessDoc.coordinates),
			businessDoc.email,
			businessDoc.password,
			businessDoc.businessTypeId == null ?
				undefined :
				new BusinessType(businessDoc.businessTypeId, undefined),
			businessDoc.timeZone as TimeZone,
			businessDoc.currency as Currency,
			businessDoc.isOperatingNonStop == null ?
				undefined :
				businessDoc.isOperatingNonStop,
			businessDoc.businessHoursBlocks == null || businessDoc.businessHoursBlocks.length == 0 ?
				undefined :
				businessDoc.businessHoursBlocks.map(bh => BusinessHoursBlockDbModel.convertToDomainModel(bh)),
			businessDoc.about == null ?
				undefined :
				businessDoc.about,
			undefined,
			businessDoc.serviceCategories == null || businessDoc.serviceCategories.length == 0? 
				undefined :
				businessDoc.serviceCategories.map(sc => ServiceCategoryDbModel.convertToDomainModel(sc)),
			businessDoc.setting == null ?
				undefined :
				BusinessSettingDbModel.convertToDomainModel(businessDoc.setting),
			businessDoc.isActive,
			businessDoc.isDeleted
		)

		delete business.password
		business.orderBusinessHoursBlocks()
		return business
	}
}

export interface IBusiness extends Document {
	name: string
	slug: string
	phoneNumber: string
	address: IAddress
	coordinates: ICoordinates
	email: string
	password: string
	timeZone: string
	currency: number
	isOperatingNonStop: boolean
	businessHoursBlocks: IBusinessHoursBlock[]
	businessTypeId: string
	about: string
	serviceCategories: IServiceCategoryType[]
	setting: IBusinessSetting
	isActive: boolean
	isDeleted: boolean
	passwordResetToken: Document
	activationToken: Document
}