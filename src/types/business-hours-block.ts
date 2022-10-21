import { DayOfTheWeek } from './enums/day-of-the-week.enum'

export class BusinessHoursBlock {

	constructor(
			public startDayOfTheWeek: DayOfTheWeek,
			public startHour: number,
			public startMinute: number,
			public endDayOfTheWeek: DayOfTheWeek,
			public endHour: number,
			public endMinute: number) {}

	public getStartTimeInteger(): number {
		return Number(`${this.startDayOfTheWeek}${this.startHour.toString().padStart(2, '0')}${this.startMinute.toString().padStart(2, '0')}`)
	}

	public getEndTimeInteger(): number {
		return Number(`${this.endDayOfTheWeek}${this.endHour.toString().padStart(2, '0')}${this.endMinute.toString().padStart(2, '0')}`)
	}
}