import { Schema, Document, model } from "mongoose"

import { BusinessServiceSnapshot } from "../types/business-service-snapshot"
import { Currency } from "../types/enums/currency"
import { DurationUnit } from "../types/enums/duration-unit.enum"

export abstract class BusinessServiceSnapshotDbModel {

	public static businessServiceSnapshotSchema = new Schema({
		serviceHash: {
			type: String,
			index: true
		},
		serviceName: String,
		serviceDescription: String,
		serviceDuration: Number,
		serviceDurationUnit: {
			type: Number,
			enum: Object.values(DurationUnit).filter(v => Number.isInteger(v))
		},
		servicePrice: Number,
		serviceCurrency: {
			type: Number,
			enum: Object.values(Currency).filter(v => Number.isInteger(v))
		}
	})
	
	public static BusinessServiceSnapshotModel = model<IBusinessServiceSnapshot>('business-service-snapshot', BusinessServiceSnapshotDbModel.businessServiceSnapshotSchema)

	public static convertToDbModel(businessServiceSnapshot: BusinessServiceSnapshot): IBusinessServiceSnapshot {
		return new BusinessServiceSnapshotDbModel.BusinessServiceSnapshotModel({
			serviceHash: businessServiceSnapshot.serviceHash,
			serviceName: businessServiceSnapshot.serviceName,
			serviceDescription: businessServiceSnapshot.serviceDescription == null ?
				undefined :
				businessServiceSnapshot.serviceDescription,
			serviceDuration: businessServiceSnapshot.serviceDuration,
			serviceDurationUnit: businessServiceSnapshot.serviceDurationUnit,
			servicePrice: businessServiceSnapshot.servicePrice,
			serviceCurrency: businessServiceSnapshot.serviceCurrency == null ?
				undefined :
				businessServiceSnapshot.serviceCurrency
		})
	}

	public static convertToDomainModel(businessServiceSnapshotDoc: IBusinessServiceSnapshot): BusinessServiceSnapshot {
		return new BusinessServiceSnapshot(
			businessServiceSnapshotDoc._id.toString(),
			businessServiceSnapshotDoc.serviceHash,
			businessServiceSnapshotDoc.serviceName,
			businessServiceSnapshotDoc.serviceDescription == null ?
				undefined :
				businessServiceSnapshotDoc.serviceDescription,
			businessServiceSnapshotDoc.serviceDuration,
			businessServiceSnapshotDoc.serviceDurationUnit,
			businessServiceSnapshotDoc.servicePrice,
			businessServiceSnapshotDoc.serviceCurrency == null ?
				undefined :
				businessServiceSnapshotDoc.serviceCurrency)
	}
}

export interface IBusinessServiceSnapshot extends Document {
	serviceHash: string
	serviceName: string
	serviceDescription: string
	serviceDuration: number
	serviceDurationUnit: number
	servicePrice: number
	serviceCurrency: number
}