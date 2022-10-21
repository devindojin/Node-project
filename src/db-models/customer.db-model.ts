import { Schema } from "mongoose"

import { Customer } from "../types/customer"

export abstract class CustomerDbModel {

	public static customerSchema = new Schema({
			name: String,
			surname: String,
			email: String,
			phoneNumber: String
		},
		{ _id: false }
	)

	public static convertToDbModel(customer: Customer): ICustomer {
		return {
			name: customer.name,
			surname: customer.surname,
			email: customer.email,
			phoneNumber: customer.phoneNumber == null ?
				undefined :
				customer.phoneNumber,
		}
	}

	public static convertToDomainModel(customerDoc: ICustomer): Customer {
		return new Customer(
			customerDoc.name,
			customerDoc.surname,
			customerDoc.email,
			customerDoc.phoneNumber == null ?
				undefined :
				customerDoc.phoneNumber
		)
	}

}

export interface ICustomer {
	name: string
	surname: string
	email: string
	phoneNumber: string
}