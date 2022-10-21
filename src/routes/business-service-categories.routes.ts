import { Router } from "express"

import { ServiceCategoriesSerice } from "../services/service-categories.service"
import { ServiceCategory } from "../types/service-category"
import { IdValidator } from "../validators/id.validator"
import { ServiceCategoryValidator } from "../validators/service-category.validator"
import { BusinessesRoutes } from "./businesses.routes"


export abstract class BusinessServicesCategoriesRoutes {
	public static businessServiceCategoriesPath = `${BusinessesRoutes.businessesPath}/:businessId/service-categories`

	public static addBusinessServicesCategoriesRoutes(): Router {
		const router = Router({mergeParams: true})
		BusinessServicesCategoriesRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {

		router.get('/:categoryId', async (req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string
			const categoryIdParam = (req.params as any).categoryId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(categoryIdParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await ServiceCategoriesSerice.getById(businessIdParam, categoryIdParam))
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
				res.json(await ServiceCategoriesSerice.get(businessIdParam))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.post('/', async(req, res, next) => {

			const businessIdParam = (req.params as any).businessId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					ServiceCategoryValidator.isInvalidForCreateOrUpdate(req.body)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.status(201).json(await ServiceCategoriesSerice.create(
					businessIdParam,
					new ServiceCategory(
						null,
						req.body.name,
						req.body.description == null ?
							undefined :
							req.body.description)))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.put('/:categoryId', async(req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string
			const categoryIdParam = (req.params as any).categoryId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(categoryIdParam) ||
					ServiceCategoryValidator.isInvalidForCreateOrUpdate(req.body)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			let result: ServiceCategory

			try {
				result = await ServiceCategoriesSerice.update(
					businessIdParam,
					new ServiceCategory(
						categoryIdParam,
						req.body.name,
						req.body.description == null ?
							undefined :
							req.body.description))
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

		router.delete('/:categoryId', async (req, res, next) => {
			const businessIdParam = (req.params as any).businessId as string
			const categoryIdParam = (req.params as any).categoryId as string

			if (IdValidator.isInvalidForRead(businessIdParam) ||
					IdValidator.isInvalidForRead(categoryIdParam)) {
				res.status(400).send()
				return
			}

			if (businessIdParam != res.locals.userId) {
				res.status(403).send()
				return
			}

			try {
				res.json(await ServiceCategoriesSerice.delete(businessIdParam, categoryIdParam))
				return
			} catch (err) {
				next(err)
				return
			}
		})

	}

}