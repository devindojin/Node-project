import { Schema } from "mongoose"

import { BusinessHoursBlock } from "../types/business-hours-block"
import { DayOfTheWeek } from "../types/enums/day-of-the-week.enum"


export abstract class BusinessHoursBlockDbModel {

	public static businessHoursBlockSchema = new Schema({
			startDayOfTheWeek: {
				type: Number,
				enum: Object.values(DayOfTheWeek).filter(v => Number.isInteger(v))
			},
			startHour: Number,
			startMinute: Number,
			endDayOfTheWeek: {
				type: Number,
				enum: Object.values(DayOfTheWeek).filter(v => Number.isInteger(v))
			},
			endHour: Number,
			endMinute: Number
		},
		{ _id: false }
	)

	public static convertToDbModel(businessHoursBlock: BusinessHoursBlock): IBusinessHoursBlock {
		return {
			startDayOfTheWeek: businessHoursBlock.startDayOfTheWeek,
			startHour: businessHoursBlock.startHour,
			startMinute: businessHoursBlock.startMinute,
			endDayOfTheWeek: businessHoursBlock.endDayOfTheWeek,
			endHour: businessHoursBlock.endHour,
			endMinute: businessHoursBlock.endMinute,
		}
	}

	public static convertToDomainModel(businessHoursBlockDoc: IBusinessHoursBlock): BusinessHoursBlock {
		return new BusinessHoursBlock(
			businessHoursBlockDoc.startDayOfTheWeek,
			businessHoursBlockDoc.startHour,
			businessHoursBlockDoc.startMinute,
			businessHoursBlockDoc.endDayOfTheWeek,
			businessHoursBlockDoc.endHour,
			businessHoursBlockDoc.endMinute
		)
	}
}

export interface IBusinessHoursBlock {
	startDayOfTheWeek: number
	startHour: number
	startMinute: number
	endDayOfTheWeek: number
	endHour: number
	endMinute: number
}