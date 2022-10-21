import { Schema, Document, model } from "mongoose"

import { BusinessType } from "../types/business-type"

export abstract class BusinessTypeDbModel {

	private static businessTypeSchema = new Schema({
		name: {
			type: String,
			unique: true
		}
	})

	public static BusinessTypeModel = model<IBusinessType>('business-type', BusinessTypeDbModel.businessTypeSchema)

	public static convertToDbModel(businessType: BusinessType): IBusinessType {
		return new BusinessTypeDbModel.BusinessTypeModel({
			name: businessType.name
		})
	}

	public static convertToDomainModel(businessTypeDoc: IBusinessType): BusinessType {
		return new BusinessType(
			businessTypeDoc.id.toString(),
			businessTypeDoc.name
		)
	}
}

export interface IBusinessType extends Document {
	name: string
}