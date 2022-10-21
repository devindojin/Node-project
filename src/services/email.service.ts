import * as emailClient from '@sendgrid/mail'

import { IBooking } from "../db-models/booking.db-model"
import { IBusiness } from "../db-models/business.db-model"
import { EmailServiceError } from "../errors/email-service.error"
import { Logger } from "../logger"
import { Business } from "../types/business"
import { BusinessServiceSnapshot } from "../types/business-service-snapshot"
import { Message } from "../types/send-grid/message"
import { Person } from "../types/send-grid/person"
import { Personalization } from "../types/send-grid/personalizations"
import { DateUtils } from "../utils/date.utils"
import { DurationUnit } from "../types/enums/duration-unit.enum"
import { Currency } from "../types/enums/currency"
import { Booking } from "../types/booking"
import { Address } from "../types/address"
import { Attachment } from "../types/send-grid/attachment"

export abstract class EmailService {
	private static fromEmail = "hello@rezrva.com"
	private static fromName = "Rezrva Team"
	private static dashboardUrl = "https://app.rezrva.com/business/bookings"

	public static setApiForEmailClient(): void {
		emailClient.setApiKey(process.env.SENDGRID_KEY)
	}

	public static async sendBookingRequestToBusiness(business: Business, bookingDoc: IBooking, serviceSnapshot: BusinessServiceSnapshot): Promise<void> {

		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			service_name: serviceSnapshot.serviceName,
			customer_first_name: bookingDoc.customer.name,
			customer_last_name: bookingDoc.customer.surname,
			reservation_date: DateUtils.toLocalDateString(bookingDoc.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(bookingDoc.startDate, business.timeZone),
			service_duration: `${serviceSnapshot.serviceDuration} ${EmailService.getDurationNameInSpanish(serviceSnapshot.serviceDuration, serviceSnapshot.serviceDurationUnit)}`,
			service_price: `${serviceSnapshot.servicePrice / 100} ${serviceSnapshot.servicePrice == 0 ? '' : Currency[serviceSnapshot.serviceCurrency]}`,
			reservation_notes: bookingDoc.notes == null ? '—' : bookingDoc.notes,
			booking_page_url: `${ EmailService.dashboardUrl}/${bookingDoc._id}`,
			dashboard_url: EmailService.dashboardUrl
		}

		const message = EmailService.creteMessage(business.email, business.name, templateData, "d-26134c815e1845f7880271ded54babdc", true)

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking request email to business ${business.id} for booking ${bookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking request email to business ${business.id} for booking ${bookingDoc._id}`)
		}
	}

	public static async sendBookingRequestToCustomer(business: Business, bookingDoc: IBooking, serviceSnapshot: BusinessServiceSnapshot): Promise<void> {

		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			service_name: serviceSnapshot.serviceName,
			customer_name: bookingDoc.customer.name,
			reservation_date: DateUtils.toLocalDateString(bookingDoc.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(bookingDoc.startDate, business.timeZone),
			service_duration: `${serviceSnapshot.serviceDuration} ${EmailService.getDurationNameInSpanish(serviceSnapshot.serviceDuration, serviceSnapshot.serviceDurationUnit)}`,
			service_price: `${serviceSnapshot.servicePrice / 100} ${serviceSnapshot.servicePrice == 0 ? '' : Currency[serviceSnapshot.serviceCurrency]}`,
			reservation_notes: bookingDoc.notes == null ? '—' : bookingDoc.notes,
			cancellation_url: `https://app.rezrva.com/@${business.slug}/cancel/${bookingDoc._id}/${bookingDoc.customerCancellationToken._id}`
		}

		const message = EmailService.creteMessage(bookingDoc.customer.email, `${bookingDoc.customer.name} ${bookingDoc.customer.surname}`, templateData, "d-42f1fb1e3150431cb9ffc4112c902a98")

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking request email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking request email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}`)
		}
	}

	public static async sendBookingApprovedToCustomer(business: Business, bookingDoc: IBooking, serviceSnapshot: BusinessServiceSnapshot, icsFileString: string): Promise<void> {
		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			service_name: serviceSnapshot.serviceName,
			business_email: business.email,
			business_phone: business.phoneNumber == null ? '—' : business.phoneNumber,
			business_address: EmailService.concatenateAddress(business.address),
			customer_first_name: bookingDoc.customer.name,
			customer_last_name: bookingDoc.customer.surname,
			service_description: serviceSnapshot.serviceDescription == null ? '—' : serviceSnapshot.serviceDescription,
			reservation_date: DateUtils.toLocalDateString(bookingDoc.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(bookingDoc.startDate, business.timeZone),
			service_duration: `${serviceSnapshot.serviceDuration} ${EmailService.getDurationNameInSpanish(serviceSnapshot.serviceDuration, serviceSnapshot.serviceDurationUnit)}`,
			service_price: `${serviceSnapshot.servicePrice / 100} ${serviceSnapshot.servicePrice == 0 ? '' : Currency[serviceSnapshot.serviceCurrency]}`,
			customer_name: `${bookingDoc.customer.name} ${bookingDoc.customer.surname}`,
			reservation_notes: bookingDoc.notes == null ? '—' : bookingDoc.notes,
			cancellation_url: `https://app.rezrva.com/@${business.slug}/cancel/${bookingDoc._id}/${bookingDoc.customerCancellationToken._id}`
		}

		const message = EmailService.creteMessage(
			bookingDoc.customer.email,
			`${bookingDoc.customer.name} ${bookingDoc.customer.surname}`,
			templateData,
			"d-83a578b7b08b4aa7b4c525c01da55c64",
			true,
			icsFileString == null ? undefined : new Attachment(icsFileString, "rezrva.ics", "application/ics"))

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking approved email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking approved email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}`)
		}
	}

	public static async sendBookingApprovedToBusiness(business: Business, bookingDoc: IBooking, serviceSnapshot: BusinessServiceSnapshot, icsFileString: string): Promise<void> {
		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			service_name: serviceSnapshot.serviceName,
			customer_first_name: bookingDoc.customer.name,
			customer_last_name: bookingDoc.customer.surname,
			reservation_date: DateUtils.toLocalDateString(bookingDoc.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(bookingDoc.startDate, business.timeZone),
			service_price: `${serviceSnapshot.servicePrice / 100} ${serviceSnapshot.servicePrice == 0 ? '' : Currency[serviceSnapshot.serviceCurrency]}`,
			reservation_notes: bookingDoc.notes == null ? '—' : bookingDoc.notes,
		}

		const message = EmailService.creteMessage(
			business.email,
			business.name,
			templateData,
			"d-bb4a64c621fb40c6b58ae953f023fd33",
			false,
			icsFileString == null ? undefined : new Attachment(icsFileString, "rezrva.ics", "application/ics"))

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking approved email to business ${business.email} for booking ${bookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking approved email to business ${business.email} for booking ${bookingDoc._id}`)
		}
	}

	public static async sendBookingRejectedToCustomer(business: Business, booking: Booking): Promise<void> {
		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			service_name: booking.serviceSnapshot.serviceName,
			business_link: `https://app.rezrva.com/@${business.slug}`
		}

		const message = EmailService.creteMessage(booking.customer.email, `${booking.customer.name} ${booking.customer.surname}`, templateData, "d-35b8237064cb486286b38f4f94e8347d", true)

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking rejected email to customer ${booking.customer.email} for booking ${booking.id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking rejected email to customer ${booking.customer.email} for booking ${booking.id}`)
		}
	}

	public static async sendBookingCancelledToCustomer(business: Business, booking: Booking): Promise<void> {
		const templateData = {
			business_name: business.name == null ? '—' : business.name,
			business_link: `https://app.rezrva.com/@${business.slug}`
		}	

		const message = EmailService.creteMessage(booking.customer.email, `${booking.customer.name} ${booking.customer.surname}`, templateData, "d-2e0a3693d8be4a91b4a322764fcf1cf1",true)

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking cancelled email to customer ${booking.customer.email} for booking ${booking.id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking cancelled email to customer ${booking.customer.email} for booking ${booking.id}`)
		}
	}

	public static async sendBookingCancelledToBusiness(business: Business, booking: Booking): Promise<void> {
		const templateData = {
			customer_first_name: booking.customer.name,
			customer_last_name: booking.customer.surname,
			service_name: booking.serviceSnapshot.serviceName,
			reservation_date: DateUtils.toLocalDateString(booking.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(booking.startDate, business.timeZone),
			customer_name: `${booking.customer.name} ${booking.customer.surname}`,
			reservation_number: booking.friendlyId,
			dashboard_url: EmailService.dashboardUrl
		}

		const message = EmailService.creteMessage(business.email, business.name, templateData, "d-0bece41142d84f7bb3ac07b868966405",true)

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking cancelled email to business ${business.id} for booking ${booking.id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking cancelled email to business ${business.id} for booking ${booking.id}`)
		}
	}

	public static async sendBookingReminderToCustomer(business: Business, serviceSnapshot: BusinessServiceSnapshot, bookingDoc: IBooking): Promise<void> {
		const templateData = {
			customer_name: bookingDoc.customer.name,
			service_name: serviceSnapshot.serviceName,
			reservation_date: DateUtils.toLocalDateString(bookingDoc.startDate, business.timeZone),
			reservation_time: DateUtils.toLocalTimeString(bookingDoc.startDate, business.timeZone),
			business_name: business.name == null ? '—' : business.name,
			business_email: business.email,
			business_phone: business.phoneNumber == null ? '—' : business.phoneNumber,
			business_address: EmailService.concatenateAddress(business.address)
		}

		const message = EmailService.creteMessage(bookingDoc.customer.email, `${bookingDoc.customer.name} ${bookingDoc.customer.surname}`, templateData, "d-735372b3473a494c96d86d28be00b2e8")

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send booking reminder email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send booking reminder email to customer ${bookingDoc.customer.email} for booking ${bookingDoc._id}`)
		}
	}

	public static async sendAccountActivationToBusiness(businessDoc: IBusiness): Promise<void> {

		const templateData = {
			activation_url: `https://app.rezrva.com/activate/${businessDoc._id}/${businessDoc.activationToken._id}`
		}

		const message = EmailService.creteMessage(businessDoc.email, businessDoc.name, templateData, "d-b6420f1ffaaf4737a680ed396a76bf63", true)

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send account activation email to business ${businessDoc._id.toString()}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send account activation email to business ${businessDoc._id.toString()}`)
		}
	}

	public static async sendPasswordResetToBusiness(businessDoc: IBusiness): Promise<void> {

		const templateData = {
			reset_url: `https://app.rezrva.com/password-reset/${businessDoc._id.toString()}/${businessDoc.passwordResetToken._id.toString()}`
		}

		const message = EmailService.creteMessage(businessDoc.email, businessDoc.name, templateData, "d-c617210aa3bb43eb9345aee0bd93c31e")

		try {
			await emailClient.send(message as any)
		} catch (err) {
			Logger.logger.warn(`Failed to send password reset email to business ${businessDoc._id.toString()}${err.message != null ? '. ' + err.message : '' }`)
			throw new EmailServiceError(`Failed to send password reset email to business ${businessDoc._id.toString()}`)
		}
	}

	private static creteMessage(
			recipientEmail: string,
			recipientName: string,
			templateData: object,
			templateId: string,
			bccForRezrva: boolean = false,
			attachment: Attachment = undefined): Message {

		return new Message(
			[
				new Personalization(
					[
						new Person(
							recipientEmail,
							recipientName
						)
					],
					bccForRezrva == false ? undefined : [
						new Person(
							EmailService.fromEmail,
							"Rezrva"
						)
					],
					templateData
				)
			],
			new Person(
				EmailService.fromEmail,
				EmailService.fromName
			),
			attachment == null ? undefined : [ attachment ],
			templateId
		)
	}

	private static getDurationNameInSpanish(duration: number, durationUnit: DurationUnit): string {
		switch (durationUnit) {
			case DurationUnit.Minute:
				return `minuto${duration == 1 ? '' : 's'}`
			case DurationUnit.Hour:
				return `hora${duration == 1 ? '' : 's'}`
			default: 
				return ''
		}
	}

	private static concatenateAddress(address: Address): string {
		if (address == null) {
			return '—'
		}
		return `${address.address}, ${address.city}, ${address.country}`
	}
	
}