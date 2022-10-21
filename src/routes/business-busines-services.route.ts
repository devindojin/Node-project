import { Router } from "express"

import { BusinessServicesService } from "../services/business-services.service"
import { BookingReminder } from "../types/booking-reminder"
import { BusinessService } from "../types/business-service"
import { BookingReminderType } from "../types/enums/booking-reminder-type.enum"
import { ServiceCategory } from "../types/service-category"
import { BusinessServiceValidator } from "../validators/business-service.validator"
import { IdValidator } from "../validators/id.validator"
import { BusinessesRoutes } from "./businesses.routes"


export abstract class BusinessBusinessServicesRoutes {
	public static businessBusinessServicesPath = `${BusinessesRoutes.businessesPath}/:businessId/business-services`

	public static addBusinessBusinessServicesRoutes(): Router {
		const router = Router({mergeParams: true})
		BusinessBusinessServicesRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {

		router.get('/:serviceId', async (req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BusinessServicesService.getById(businessIdParam, serviceIdParam))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.get('/', async (req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string

			if (IdValidator.isInvalidForRead(businessIdParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BusinessServicesService.get(businessIdParam))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.post('/', async(req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					BusinessServiceValidator.isInvalidForCreate(req.body)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.status(201).json(await BusinessServicesService.create(
					businessIdParam,
					new BusinessService(
						null,
						req.body.name,
						req.body.description == null ?
							undefined :
							req.body.description,
						req.body.category == null ?
							undefined :
							new ServiceCategory(
								req.body.category.id,
								req.body.category.name == null ?
									undefined :
									req.body.category.name,
								req.body.category.description == null ?
									undefined :
									req.body.category.description),
						req.body.duration,
						req.body.durationUnit,
						req.body.price == null ?
							undefined :
							req.body.price,
						req.body.currency == null ?
							undefined :
							req.body.currency,
						req.body.hash == null ?
							undefined :
							req.body.hash,
						[
							new BookingReminder(60 * 24, [BookingReminderType.Email]),
							new BookingReminder(60 * 2, [BookingReminderType.Email])
						],
						req.body.isActive == null ?
							undefined :
							req.body.isActive,
						req.body.isDeleted == null ?
							undefined :
							req.body.isDeleted)))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.put('/:serviceId', async(req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam) ||
					BusinessServiceValidator.isInvalidForUpdate(req.body)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			let result: BusinessService

			try {
				result = await BusinessServicesService.update(
					businessIdParam,
					new BusinessService(
						serviceIdParam,
						req.body.name,
						req.body.description == null ?
							undefined :
							req.body.description,
						req.body.category == null ?
							undefined :
							new ServiceCategory(
								req.body.category.id,
								req.body.category.name == null ?
									undefined :
									req.body.category.name,
								req.body.category.description == null ?
									undefined :
									req.body.category.description),
						req.body.duration,
						req.body.durationUnit,
						req.body.price == null ?
							undefined :
							req.body.price,
						req.body.currency == null ?
							undefined :
							req.body.currency,
						req.body.hash == null ?
							undefined :
							req.body.hash,
						undefined,
						req.body.isActive == null ?
							undefined :
							req.body.isActive,
						req.body.isDeleted == null ?
							undefined :
							req.body.isDeleted))
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

		router.delete('/:serviceId', async (req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string
			const serviceIdParam = (req.params as any).serviceId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(serviceIdParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BusinessServicesService.delete(businessIdParam, serviceIdParam))
				return
			} catch (err) {
				next(err)
				return
			}
		})

	}

}