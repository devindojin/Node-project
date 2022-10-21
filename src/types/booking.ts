import { Business } from "./business"
import { BusinessService } from "./business-service"
import { BusinessServiceSnapshot } from "./business-service-snapshot"
import { Customer } from "./customer"
import { BookingStatus } from "./enums/booking.status"

export class Booking {

	constructor(
			public id: string,
			public business: Business,
			public service: BusinessService,
			public friendlyId: string,
			public startDate: Date,
			public endDate: Date,
			public customer: Customer,
			public notes: string,
			public status: BookingStatus,
			public serviceSnapshot: BusinessServiceSnapshot) {}
}