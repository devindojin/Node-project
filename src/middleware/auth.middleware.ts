import { AuthenticationService } from "../services/authentication.service"

export abstract class AuthMiddleware {

	public static getAuthFunction(errorWhenAuthenticationFails: boolean = true) {

		return async (req, res, next) => {
			const authHeader = req.headers.authorization
			const token = authHeader?.split(' ')[1]
	
			if (token == null || token == "") {
				if (errorWhenAuthenticationFails) {
					res.status(401).send()
					return
				}
				next()
				return
			}
	
			try {
				res.locals.userId = await AuthenticationService.getUserIdFromToken(token)
			} catch (err) {
				if (errorWhenAuthenticationFails) {
					res.status(401).send()
					return
				}
			}
			next()
		}
	}

}