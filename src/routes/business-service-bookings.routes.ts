import { Router } from "express"
import Joi = require("joi")

import { AuthMiddleware } from "../middleware/auth.middleware"
import { BookingsService } from "../services/bookings.service"
import { Booking } from "../types/booking"
import { Business } from "../types/business"
import { BusinessService } from "../types/business-service"
import { BusinessServiceSnapshot } from "../types/business-service-snapshot"
import { BookingStatus } from "../types/enums/booking.status"
import { BaseValidator } from "../validators/base.validator"
import { BookingValidator } from "../validators/booking.validator"
import { IdValidator } from "../validators/id.validator"
import { BusinessBusinessServicesRoutes } from "./business-busines-services.route"


export abstract class BusinessServiceBookingsRoutes {
	public static businessServiceBookingsPath = `${BusinessBusinessServicesRoutes.businessBusinessServicesPath}/:serviceId/bookings`

	public static addBusinessServiceBookingsRoutes(): Router {
		const router = Router({mergeParams: true})
		BusinessServiceBookingsRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {

		router.get('/:bookingId', AuthMiddleware.getAuthFunction(), async (req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam) ||
					IdValidator.isInvalidForRead(req.params.bookingId)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BookingsService.getByIdForBusinessAndService(businessIdParam, serviceIdParam, req.params.bookingId))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.get('/', AuthMiddleware.getAuthFunction(), async (req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string
			const statusParam = req.query.status as string
			const pastParam = req.query.past as string
			const fromParam = req.query.from as string
			const toParam = req.query.to as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
				IdValidator.isInvalidForRead(serviceIdParam) ||
				BusinessServiceBookingsRoutes.areGetParamsInvalid(statusParam, pastParam, fromParam, toParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			const status: BookingStatus = statusParam === undefined ?
				undefined :
				BookingStatus[statusParam]

			const past = pastParam != null ?
				pastParam.toLowerCase() == 'true' :
				null

			const from = fromParam != null ?
				new Date(fromParam) :
				null

			const to = toParam != null ?
				new Date(toParam) :
				null

			try {
				res.json(await BookingsService.getForBusinessAndService(businessIdParam, serviceIdParam, status, past, from, to))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.post('/', async(req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam) ||
					BookingValidator.isInvalidForCreate(req.body)) {
				res.status(400).send()
				return
			}

			try {
				res.status(201).json(await BookingsService.create(new Booking(
					null,
					new Business(businessIdParam, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null),
					new BusinessService(serviceIdParam, null, null, null, null, null, null, null, null, null, null, null),
					undefined,
					new Date(req.body.startDate),
					new Date(req.body.endDate),
					req.body.customer,
					req.body.notes == null ?
						undefined :
						req.body.notes,
					req.body.status == null ?
						undefined :
						req.body.status,
					req.body.serviceSnapshot == null ?
						undefined :
						new BusinessServiceSnapshot(
							req.body.serviceSnapshot.id,
							req.body.serviceSnapshot.serviceHash,
							req.body.serviceSnapshot.serviceName,
							req.body.serviceSnapshot.serviceDescription,
							req.body.serviceSnapshot.serviceDuration,
							req.body.serviceSnapshot.serviceDurationUnit,
							req.body.serviceSnapshot.servicePrice,
							req.body.serviceSnapshot.serviceCurrency))))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.patch('/:bookingId', AuthMiddleware.getAuthFunction(), async (req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string
			const bookingIdParam = (req.params as any).bookingId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam) ||
					IdValidator.isInvalidForRead(req.params.bookingId) ||
					BookingValidator.isInvalidForPartialUpdate(req.body)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			let result: Booking

			try {
				result = await BookingsService.partialUpdate(
					new Booking(
						bookingIdParam,
						new Business(businessIdParam, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
						new BusinessService(serviceIdParam, null, null, null, null, null, null, null, null, null, null, null),
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						req.body.status == null ?
							undefined :
							req.body.status,
						req.body.serviceSnapshot == null ?
							undefined :
							new BusinessServiceSnapshot(
								req.body.serviceSnapshot.id,
								req.body.serviceSnapshot.serviceHash,
								req.body.serviceSnapshot.serviceName,
								req.body.serviceSnapshot.serviceDescription,
								req.body.serviceSnapshot.serviceDuration,
								req.body.serviceSnapshot.serviceDurationUnit,
								req.body.serviceSnapshot.servicePrice,
								req.body.serviceSnapshot.serviceCurrency)
					)
				)
			} catch (err) {
				next(err)
				return
			}

			if (result == null) {
				res.status(204).send()
				return
			}
			
			res.json(result)
			return
		})

	}

	private static areGetParamsInvalid(statusParam: string, pastParam: string, fromParam: string, toParam: string): boolean {
		const validationSchema = Joi.object({
			status: Joi.string().valid(...Object.values(BookingStatus).filter(bs => typeof bs === 'string')).optional(),
			past: Joi.boolean().optional(),
			from: Joi.date().optional(),
			to: Joi.when(
				'from', {
					is: Joi.date().required(),
					then: Joi.date().greater(Joi.ref('from')).optional(),
					otherwise: Joi.date().optional()})
		})
			.oxor('past', 'from')
			.oxor('past', 'to')

		const validationPayload = {
			status: statusParam,
			past: pastParam,
			from: fromParam,
			to: toParam
		}

		return BaseValidator.isInvalidForSchema(validationPayload, validationSchema)
	}
}