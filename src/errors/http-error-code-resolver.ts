import { ReferencedResourceNotFoundError } from "./referenced-resource-not-found.error"
import { ResourceAlreadyExistsError } from "./resource-already-exists.error"
import { InvalidTokenError } from "./invalid-token.error"
import { ActionForbiddenError } from "./action-forbidden.error"
import { Logger } from "../logger"
import { BadRequestError } from "./bad-request.error"

export abstract class HttpErrorCodeResolver {
	public static resolveError(error: Error): number {

		if (error instanceof ReferencedResourceNotFoundError) {
			return 404
		}

		if (error instanceof ResourceAlreadyExistsError) {
			return 409
		}

		if (error instanceof InvalidTokenError) {
			return 401
		}

		if (error instanceof ActionForbiddenError) {
			return 403
		}

		if (error instanceof BadRequestError) {
			return 400
		}

		Logger.logger.error("Unhandled error", error)
		return 500
	}
}