import { Schema } from "mongoose"

import { Address } from "../types/address"

export abstract class AddressDbModel {
	public static addressSchema = new Schema(
		{
			address: String,
			city: String,
			country: String,
		},
		{ _id: false }
	)

	public static convertToDbModel(address: Address): IAddress {
		return {
			address: address.address,
			city: address.city == null ?
				undefined :
				address.city,
			country: address.country == null ?
				undefined :
				address.country,
		}
	}

	public static convertToDomainModel(addressDoc: IAddress): Address {
		return new Address(
			addressDoc.address,
			addressDoc.city == null ?
				undefined :
				addressDoc.city,
			addressDoc.country == null ?
				undefined :
				addressDoc.country)
	}
}

export interface IAddress {
	address: string
	city: string
	country: string
}
