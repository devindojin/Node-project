import { Schema, Document, model } from "mongoose"

import { ServiceCategory } from "../types/service-category"

export abstract class ServiceCategoryDbModel {

	public static serviceCategorySchema = new Schema({
		name: String,
		description: String
	})

	public static ServiceCategoryModel = model<IServiceCategoryType>('service-category', ServiceCategoryDbModel.serviceCategorySchema)

	public static convertToDbModel(serviceCategory: ServiceCategory): IServiceCategoryType {
		return new ServiceCategoryDbModel.ServiceCategoryModel({
			name: serviceCategory.name,
			description: serviceCategory.description == null ?
				undefined:
				serviceCategory.description
		})
	}

	public static convertToDomainModel(serviceCategryDoc: IServiceCategoryType): ServiceCategory {
		return new ServiceCategory(
			serviceCategryDoc._id.toString(),
			serviceCategryDoc.name,
			serviceCategryDoc.description == null ?
				undefined :
				serviceCategryDoc.description
		)
	}
}

export interface IServiceCategoryType extends Document {
	name: string
	description: string
}