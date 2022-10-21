import { Router } from "express"

import { BusinessSettingService } from "../services/business-settings.service"
import { IdValidator } from "../validators/id.validator"
import { ServiceBusinessSettingValidator } from "../validators/business-setting.validator"


export abstract class BusinessSettingsRoutes {
	public static businessSettingPath = '/business-settings'

	public static addBusinessTypesRoutes(): Router {
		const router = Router()
		BusinessSettingsRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {
		router.get('/:businessTypeId', async (req, res, next) => {
			if (IdValidator.isInvalidForRead(req.params.businessTypeId)) {
				res.status(400).send()
				return
			}

			try {
				res.json(await BusinessSettingService.getById(req.params.businessTypeId))
				return
			} catch (err) {
				next(err)
				return
			}
		});

        router.patch('/update/:businessTypeId', async (req, res, next) => {
			if (ServiceBusinessSettingValidator.isInvalidForCreateOrUpdate(req.body)) {
				res.status(400).send()
				return
			}

            if (IdValidator.isInvalidForRead(req.params.businessTypeId)) {
				res.status(400).send()
				return
			}

			try {
				res.json(await BusinessSettingService.update(req.params.businessTypeId,req.body))
				return
			} catch (err) {
				next(err)
				return
			}
		})
	}

}