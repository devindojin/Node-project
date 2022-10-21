import { DayOfTheWeek } from "../types/enums/day-of-the-week.enum"
import { TimeZone } from "../types/enums/time-zone.enum"

export abstract class DateUtils {

	public static toLocalDateString(date: Date, timeZone: TimeZone): string {
		return date.toLocaleString("es-419", { timeZone: timeZone, dateStyle: 'full' })
	}

	public static toLocalTimeString(date: Date, timeZone: TimeZone): string {
		return date.toLocaleString("es-419", { timeZone: timeZone, timeStyle: 'short' })
	}

	public static getLocalDayString(date: Date, timeZone: TimeZone): String {
		const localDateString = this.getLocalDateString(date, timeZone)
		return localDateString.split(', ')[1].split('-')[2]
	}

	public static getLocalDayOfTheWeek(date: Date, timeZone: TimeZone): DayOfTheWeek {
		const localDateString = this.getLocalDateString(date, timeZone)
		return DayOfTheWeek[localDateString.split(', ')[0]]
	}

	public static getLocalHourString(date: Date, timeZone: TimeZone): string {
		const localDateString = this.getLocalDateString(date, timeZone)
		return localDateString.split(', ')[2].split(':')[0]
	}

	public static getLocalMinuteString(date: Date, timeZone: TimeZone): string {
		const localDateString = this.getLocalDateString(date, timeZone)
		return localDateString.split(', ')[2].split(':')[1]
	}

	public static getLocalDateString(date: Date, timeZone: TimeZone): string {
		return date.toLocaleString('en-CA', {
			timeZone,
			weekday: 'long',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			hour12: false
		})
	}

	public static dateToShortString(date: Date): string {
		return Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' }).format(date)
	}

	public static differenceInMinutes(dateA: Date, dateB: Date): number {
		return (Math.floor((dateB.getTime() - dateA.getTime()) / (1000 * 60)))
	}
}