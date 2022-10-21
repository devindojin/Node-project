import { Router } from "express"

import { CredentialsValidator } from "../validators/credentials.validator"
import { AuthenticationService } from "../services/authentication.service"
import { Credentials } from "../types/credentials"

export abstract class AuthenticateRoutes {

	public static authenticatePath = '/authenticate'

	public static addAuthenticateRoutes(): Router {
		const router = Router()
		AuthenticateRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router) {
		router.post('/', async (req, res, next) => {

			if (CredentialsValidator.isInvalid(req.body)) {
				res.status(401).send()
				return
			}

			try {
				const tokens = await AuthenticationService.authenticate(
					new Credentials(req.body.email, req.body.password)
				)
				if (tokens == null) {
					res.status(401).send()
					return
				}
				
				res.json(tokens)
				return
			} catch (err) {
				next(err)
				return
			}
		})
	}
}