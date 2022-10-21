import * as bcrypt from 'bcrypt'

import { BusinessTypeDbModel, IBusinessType } from "./db-models/business-type.db-model"
import { BusinessDbModel } from "./db-models/business.db-model"
import { Logger } from './logger'
import { BusinessType } from "./types/business-type"
import { Business } from "./types/business"
import { Address } from './types/address'
import { BusinessSetting } from './types/business-setting'
import { TimeZone } from './types/enums/time-zone.enum'
import { BusinessHoursBlock } from './types/business-hours-block'
import { Currency } from "./types/enums/currency"

export abstract class DbSeeder {

	private static businessTypeDocs: IBusinessType[]

	public static async seedDatabase() {
		await DbSeeder.seedBusinessTypes()
		await DbSeeder.seedTestBusinesses()
	}

	private static async seedBusinessTypes(): Promise<void> {
		if (await BusinessTypeDbModel.BusinessTypeModel.countDocuments().exec() > 0) {
			DbSeeder.businessTypeDocs = await BusinessTypeDbModel.BusinessTypeModel.find({}).exec()
			return
		}

		const businessTypeDocs = (await this.getBusinessTypes()).map(bt => BusinessTypeDbModel.convertToDbModel(bt))

		await BusinessTypeDbModel.BusinessTypeModel.insertMany(businessTypeDocs)

		DbSeeder.businessTypeDocs = businessTypeDocs
	}

	private static async seedTestBusinesses(): Promise<void> {
		if (await BusinessDbModel.BusinessModel.countDocuments().exec() > 0) {
			return
		}

		const businessDocs = (await this.getTestBusinesses()).map(b => BusinessDbModel.convertToDbModel(b))

		await BusinessDbModel.BusinessModel.insertMany(businessDocs)
	}

	private static getBusinessTypes(): BusinessType[] {
		return [
			new BusinessType(null, "Estética & Belleza"),
			new BusinessType(null, "Fitness & Wellness"),
			new BusinessType(null, "Actividades & Tours"),
			new BusinessType(null, "Educación & Asesoría"),
			new BusinessType(null, "Transporte & Couriers"),
			new BusinessType(null, "Otro")
		]
	}

	private static async getTestBusinesses(): Promise<Business[]> {

		let hashedPassword: string = null

		try {
			hashedPassword = await bcrypt.hash('password1', 11)
		} catch (err) {
			Logger.logger.error("Failed to hash password", err)
			throw new Error("Failed to hash password")
		}

		return [
			new Business(
				null,
				"Test Hairdresser",
				"test-hairdresser",
				"912345678",
				new Address(
					"700 Arturo Prat",
					 "Buin",
					 "chile"
				),
				undefined,
				"test@mail.com",
				hashedPassword,
				// BusinessTypeDbModel.convertToDomainModel(DbSeeder.businessTypeDocs.find(bt => bt.name == 'Hairdresser')),
				undefined,
				TimeZone.Chile_Continental,
				Currency.CLP,
				false,
				[
					new BusinessHoursBlock(2, 8, 0, 2, 19, 0),
					new BusinessHoursBlock(1, 8, 0, 1, 19, 0),
					new BusinessHoursBlock(3, 8, 0, 3, 19, 0),
					new BusinessHoursBlock(4, 8, 0, 4, 19, 0),
					new BusinessHoursBlock(5, 8, 0, 5, 19, 0)
				],
				"This is a test business",
				undefined,
				undefined,
				new BusinessSetting(false),
				true,
				false,
			)
		]
	}
}