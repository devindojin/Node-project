import { Schema } from "mongoose"

import { Coordinates } from "../types/coordinates"

export abstract class CoordinatesDbModel {
	public static coordinatesSchema = new Schema(
		{
			latitude: Number,
			longitude: Number,
		},
		{ _id: false }
	)

	public static convertToDbModel(coordinates: Coordinates): ICoordinates {
		return {
			latitude: coordinates.latitude,
			longitude: coordinates.longitude
		}
	}

	public static convertToDomainModel(coordinatesDoc: ICoordinates): Coordinates {
		return new Coordinates(
			coordinatesDoc.latitude,
			coordinatesDoc.longitude
		)
	}
}

export interface ICoordinates {
	latitude: number
	longitude: number
}
