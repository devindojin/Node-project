import { Router } from "express"

import { BusinessesService } from "../services/businesses.service"
import { CredentialsValidator } from "../validators/credentials.validator"
import { IdValidator } from "../validators/id.validator"


export abstract class PasswordResetRoutes {

	public static passwordResetPath = '/password-reset'

	public static addPasswordResetRoutes(): Router {
		const router = Router()
		PasswordResetRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router) {

		router.post('/:businessId/:resetTokenId', async (req, res, next) => {

			if (IdValidator.isInvalidForRead(req.params.businessId) ||
					IdValidator.isInvalidForRead(req.params.resetTokenId) ||
					CredentialsValidator.isInvalidForNewPassword(req.body)) {
				res.status(400).send()
				return
			}

			try {
				await BusinessesService.resetPassword(req.body.password, req.params.businessId, req.params.resetTokenId)
			} catch (err) {
				next(err)
				return
			}

			res.status(204).send()
			return
		})

		router.post('/', async (req, res, next) => {

			if (CredentialsValidator.isInvalidForPasswordResetTokenRequest(req.body)) {
				res.status(400).send()
				return
			}

			try {
				await BusinessesService.createPasswordResetToken(req.body.email)
			} catch (err) {
				next(err)
				return
			}

			res.status(204).send()
			return
		})
	}
}