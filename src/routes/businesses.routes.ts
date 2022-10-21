import { Router } from "express"
import * as Joi from "joi"

import { AuthMiddleware } from "../middleware/auth.middleware"
import { BusinessesService } from "../services/businesses.service"
import { Address } from "../types/address"
import { Business } from "../types/business"
import { BusinessHoursBlock } from "../types/business-hours-block"
import { BusinessService } from "../types/business-service"
import { BusinessType } from "../types/business-type"
import { Coordinates } from "../types/coordinates"
import { Currency } from "../types/enums/currency"
import { TimeZone } from "../types/enums/time-zone.enum"
import { ServiceCategory } from "../types/service-category"
import { BaseValidator } from "../validators/base.validator"
import { BusinessValidator } from "../validators/business.validator"
import { IdValidator } from "../validators/id.validator"


export abstract class BusinessesRoutes {
	public static businessesPath = '/businesses'

	public static addBusinessesRoutes(): Router {
		const router = Router()
		BusinessesRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {

		router.get('/:businessId', AuthMiddleware.getAuthFunction(), async (req, res, next) => {

			if (IdValidator.isInvalidForRead(req.params.businessId)) {
				res.status(400).send()
				return
			}

			if (req.params.businessId != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await BusinessesService.getById(req.params.businessId))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.get('/', async (req, res, next) => {

			const slugParam = req.query.slug as string

			if (slugParam == null) {
				res.status(403).send()
				return
			}

			if (BusinessesRoutes.slugParamIsInvalid(slugParam)) {
				res.status(400).send()
				return
			}

			let business

			try {
				business = await BusinessesService.getBySlug(slugParam)
			} catch (err) {
				next(err)
				return
			}

			if (business == null) {
				res.status(404).send()
				return
			}

			res.json(business)
		})

		router.post('/', async(req, res, next) => {

			if (BusinessValidator.isInvalidForCreate(req.body)) {
				res.status(400).send()
				return
			}

			try {
				res.status(201).json(await BusinessesService.create(new Business(
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					req.body.email,
					req.body.password,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined)))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		// router.put('/:businessId', AuthMiddleware.getAuthFunction(), async(req, res, next) => {

		// 	if (BusinessValidator.isInvalidForUpdate(req.body)) {
		// 		res.status(400).send()
		// 		return
		// 	}

		// 	if (req.params.businessId != res.locals.userId) {
		// 		res.status(403).send()
		// 		return
		// 	}

		// 	let result: Business

		// 	try {
		// 		result = await BusinessesService.update(
		// 			new Business(
		// 				req.params.businessId,
		// 				req.body.name,
		// 				req.body.slug,
		// 				req.body.phoneNumber,
		// 				new Address(
		// 					req.body.address.line1,
		// 					req.body.address.line2,
		// 					req.body.address.line3,
		// 					req.body.address.town
		// 				),
		// 				req.body.email,
		// 				req.body.password == null ?
		// 					undefined :
		// 					req.body.password,
		// 				req.body.type,
		// 				req.body.timeZone as TimeZone,
		// 				req.body.bookableTimeBlockLength,
		// 				req.body.bookableTimeBlockUnit,
		// 				req.body.about == null ?
		// 					undefined :
		// 					req.body.about,
		// 				req.body.isActive,
		// 				req.body.isDeleted))
		// 	} catch (err) {
		// 		next(err)
		// 		return
		// 	}

		// 	if (result == null) {
		// 		res.status(204).send()
		// 		return
		// 	}
			
		// 	res.json(result)
		// 	return

		// })

		router.patch('/:businessId', AuthMiddleware.getAuthFunction(), async(req, res, next) => {

			if (BusinessValidator.isInvalidForPartialUpdate(req.body)) {
				res.status(400).send()
				return
			}

			if (req.params.businessId != res.locals.userId) {
				res.status(403).send()
				return
			}

			let result: Business

			try {
				result = await BusinessesService.partialUpdate(
					new Business(
						req.params.businessId,
						req.body.name,
						req.body.slug,
						req.body.phoneNumber,
						req.body.address == null ?
							undefined :
							new Address(
								req.body.address.address,
								req.body.address.city == null ?
									undefined :
									req.body.address.city,
								req.body.address.country == null ?
									undefined :
									req.body.address.country
							),
						req.body.coordinates == null ?
							undefined :
							new Coordinates(
								req.body.coordinates.latitude,
								req.body.coordinates.longitude),
						req.body.email,
						req.body.password,
						req.body.type == null ?
							undefined :
							new BusinessType(
								req.body.type.id,
								req.body.type.name
							),
						req.body.timeZone as TimeZone,
						req.body.currency as Currency,
						req.body.isOperatingNonStop,
						req.body.businessHoursBlocks == null ?
							undefined :
							req.body.businessHoursBlocks.map(bh => new BusinessHoursBlock(
								bh.startDayOfTheWeek,
								bh.startHour,
								bh.startMinute,
								bh.endDayOfTheWeek,
								bh.endHour,
								bh.endMinute
							)),
						req.body.about == null ?
							undefined :
							req.body.about,
						req.body.services == null ?
							undefined :
							req.body.services.map(s => new BusinessService(
								s.id,
								s.name, 
								s.description,
								s.category == null ?
									undefined :
									new ServiceCategory(
										s.category.id,
										s.category.name == null ?
											undefined :
											s.category.name,
										s.category.description == null ?
											undefined :
											s.category.description
									),
								s.duration,
								s.durationUnit,
								s.price,
								s.currency,
								s.hash,
								undefined,
								s.isActive,
								s.isDeleted
							)),
						req.body.serviceCategories == null ?
							undefined :
							req.body.serviceCategories.map(sc => new ServiceCategory(
								sc.id,
								sc.name,
								sc.description
							)),
						req.body.setting == null ? undefined : req.body.setting,
						req.body.isActive,
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

	}

	private static slugParamIsInvalid(slug: string): boolean {

		const validationSchema = Joi.object({
			slug: Joi.string().pattern(BaseValidator.slugRegex).min(2).max(50).required()
		})

		return BaseValidator.isInvalidForSchema({ slug }, validationSchema)
	}
}
