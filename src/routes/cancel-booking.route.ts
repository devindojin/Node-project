import { Router } from "express"

import { BookingsService } from "../services/bookings.service"
import { IdValidator } from "../validators/id.validator"


export abstract class CancelBookingRoutes {

	public static cancelBookingPath = '/cancel-booking'

	public static addCancelBookingRoutes(): Router {
		const router = Router()
		CancelBookingRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router) {

		router.post('/:bookingId/:cancelTokenId', async (req, res, next) => {
			if (IdValidator.isInvalidForRead(req.params.bookingId) ||
					IdValidator.isInvalidForRead(req.params.cancelTokenId)) {
				res.status(400).send()
				return
			}

			try {
				await BookingsService.customerCancel(req.params.bookingId, req.params.cancelTokenId)
			} catch (err) {
				next(err)
				return
			}

			res.status(204).send()
			return
		})

	}
}
