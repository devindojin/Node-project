import { Router } from "express"

import { BusinessesService } from "../services/businesses.service"
import { IdValidator } from "../validators/id.validator"


export abstract class ActivateAccountRoutes {

	public static activateAccountPath = '/activate-account'

	public static addActivateAccountRoutes(): Router {
		const router = Router()
		ActivateAccountRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router) {

		router.post('/:businessId/:activationTokenId', async (req, res, next) => {
			if (IdValidator.isInvalidForRead(req.params.businessId) ||
					IdValidator.isInvalidForRead(req.params.activationTokenId)) {
				res.status(400).send()
				return
			}

			try {
				await BusinessesService.activateAccount(req.params.businessId, req.params.activationTokenId)
			} catch (err) {
				next(err)
				return
			}

			res.status(204).send()
			return
		})

	}
}
