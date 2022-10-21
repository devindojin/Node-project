import * as crypto from "crypto"

import { BookingReminder } from "./booking-reminder"
import { Currency } from "./enums/currency"
import { DurationUnit } from "./enums/duration-unit.enum"
import { ServiceCategory } from "./service-category"

export class BusinessService {

	constructor(
			public id: string,
			public name: string,
			public description: string,
			public category: ServiceCategory,
			public duration: number,
			public durationUnit: DurationUnit,
			public price: number,
			public currency: Currency,
			public hash: string,
			public bookingReminders: BookingReminder[],
			public isActive: boolean,
			public isDeleted: boolean) {}

	public calculateHash(): void {
		this.hash = crypto.createHash("shake256", { outputLength: 11 })
			.update(this.name + this.description + this.duration + this.durationUnit + this.price + this.currency)
			.digest("hex")
	}
}