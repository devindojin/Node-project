import { Address } from "./address"
import { BusinessHoursBlock } from "./business-hours-block"
import { BusinessService } from "./business-service"
import { BusinessType } from "./business-type"
import { Coordinates } from "./coordinates"
import { Currency } from "./enums/currency"
import { DayOfTheWeek } from "./enums/day-of-the-week.enum"
import { TimeZone } from "./enums/time-zone.enum"
import { ServiceCategory } from "./service-category"
import { BusinessSetting } from "./business-setting"

export class Business {

	constructor(
			public id: string,
			public name: string,
			public slug: string,
			public phoneNumber: string,
			public address: Address,
			public coordinates: Coordinates,
			public email: string,
			public password: string,
			public type: BusinessType,
			public timeZone: TimeZone,
			public currency: Currency,
			public isOperatingNonStop: boolean,
			public businessHoursBlocks: BusinessHoursBlock[],
			public about: string,
			public services: BusinessService[],
			public serviceCategories: ServiceCategory[],
			public setting: BusinessSetting,
			public isActive: boolean,
			public isDeleted: boolean) {}

	public removePassword(): void {
		delete this.password
	}

	public orderBusinessHoursBlocks(): void {
		if (this.businessHoursBlocks?.length > 1) {
			this.businessHoursBlocks.sort((a: BusinessHoursBlock, b: BusinessHoursBlock) => {
				if (a.startDayOfTheWeek == DayOfTheWeek.Sunday) {
					return 1
				}
				if (b.startDayOfTheWeek == DayOfTheWeek.Sunday) {
					return -1
				}
				return a.startDayOfTheWeek - b.startDayOfTheWeek
			})
		}
	}
}