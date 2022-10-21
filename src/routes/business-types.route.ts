import { Router } from "express"

import { BusinessTypesService } from "../services/business-types.service"
import { IdValidator } from "../validators/id.validator"


export abstract class BusinessTypesRoutes {
	public static businessTypesPath = '/business-types'

	public static addBusinessTypesRoutes(): Router {
		const router = Router()
		BusinessTypesRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {
		router.get('/:businessTypeId', async (req, res, next) => {

			if (IdValidator.isInvalidForRead(req.params.businessTypeId)) {
				res.status(400).send()
				return
			}

			try {
				res.json(await BusinessTypesService.getById(req.params.businessTypeId))
				return
			} catch (err) {
				next(err)
				return
			}
		})

		router.get('/', async (req, res, next) => {

			try {
				res.json(await BusinessTypesService.get())
				return
			} catch (err) {
				next(err)
				return
			}

		})
	}

}