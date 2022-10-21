import { Currency } from "./enums/currency"
import { DurationUnit } from "./enums/duration-unit.enum"

export class BusinessServiceSnapshot {

	constructor(
			public id: string,
			public serviceHash: string,
			public serviceName: string,
			public serviceDescription: string,
			public serviceDuration: number,
			public serviceDurationUnit: DurationUnit,
			public servicePrice: number,
			public serviceCurrency: Currency) {}
}