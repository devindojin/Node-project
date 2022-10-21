import { createEvent, EventAttributes } from 'ics'

import { IBooking } from "../db-models/booking.db-model"
import { Business } from "../types/business"
import { BusinessServiceSnapshot } from "../types/business-service-snapshot"

export class IcsService {

	public static async generateIcs(forBusiness: boolean, business: Business, bookingDoc: IBooking, snapshot: BusinessServiceSnapshot): Promise<string> {

		const event: EventAttributes = {
			uid: bookingDoc.id,
			productId: 'rezrvapp/ics',
			start: [bookingDoc.startDate.getUTCFullYear(), bookingDoc.startDate.getUTCMonth() + 1, bookingDoc.startDate.getUTCDate(), bookingDoc.startDate.getUTCHours(), bookingDoc.startDate.getUTCMinutes()],
			startInputType: 'utc',
			startOutputType: 'utc',
			end: [bookingDoc.endDate.getUTCFullYear(), bookingDoc.endDate.getUTCMonth() + 1, bookingDoc.endDate.getUTCDate(), bookingDoc.endDate.getUTCHours(), bookingDoc.endDate.getUTCMinutes()],
			endInputType: 'utc',
			endOutputType: 'utc',
			title: `Rezerva con ${ forBusiness ? bookingDoc.customer.name + ' ' + bookingDoc.customer.surname : business.name }`,
			description: `Para servicio ${snapshot.serviceName}`,
			location: business.address == null ?
				undefined :
				business.address.address,
			geo: business.coordinates == null ?
				undefined :
				{ lat: business.coordinates.latitude, lon: business.coordinates.latitude},
			status: 'CONFIRMED',
			busyStatus: 'BUSY',
			organizer: { name: business.name, email: business.email },
			attendees: [
				{ name: `${bookingDoc.customer.name} ${bookingDoc.customer.surname}`,
					email: bookingDoc.customer.email,
					rsvp: true,
					partstat: 'ACCEPTED',
					role: 'REQ-PARTICIPANT' }
			],
			alarms: [
				{ action: 'display', trigger: { hours: 2, before: true }, repeat: 2 }
			]
		}

		return new Promise((resolve, reject) => {
			createEvent(event, (err, value) => {
				if (err) {
					reject(err)
					return
				}
		
				resolve(IcsService.toBase64(value))
			})
		})
		
	}

	private static toBase64(value: string): string {
		return Buffer.from(value).toString('base64')
	}

}