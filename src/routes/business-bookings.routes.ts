import { Router } from "express"
import Joi = require("joi")

import { BookingsService } from "../services/bookings.service"
import { BookingStatus } from "../types/enums/booking.status"
import { BaseValidator } from "../validators/base.validator"
import { IdValidator } from "../validators/id.validator"
import { BusinessesRoutes } from "./businesses.routes"


export abstract class BusinessBookingsRoutes {
	public static businessBookingsPath = `${BusinessesRoutes.businessesPath}/:businessId/bookings`

	public static addBusinessBookingsRoutes(): Router {
		const router = Router({mergeParams: true})
		BusinessBookingsRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {

		router.get('/:bookingId', async (req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(req.params.bookingId)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BookingsService.getByIdForBusiness(businessIdParam, req.params.bookingId))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.get('/', async (req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const statusParam = req.query.status as string
			const pastParam = req.query.past as string
			const fromParam = req.query.from as string
			const toParam = req.query.to as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					BusinessBookingsRoutes.areGetParamsInvalid(statusParam, pastParam, fromParam, toParam)) {
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
				res.json(await BookingsService.getForBusiness(businessIdParam, status, past, from, to))
				return
			} catch (err) {
				next(err)
				return
			}
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