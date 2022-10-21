import { Router } from "express"

import { AuthMiddleware } from "../middleware/auth.middleware"
import { ActivateAccountRoutes } from "./activate-account.route"
import { AuthenticateRoutes } from "./authenticate.routes"
import { BusinessBookingsRoutes } from "./business-bookings.routes"
import { BusinessBusinessServicesRoutes } from "./business-busines-services.route"
import { BusinessServiceBookingsRoutes } from "./business-service-bookings.routes"
import { BusinessServicesCategoriesRoutes } from "./business-service-categories.routes"
import { BusinessTypesRoutes } from "./business-types.route"
import { BusinessesRoutes } from "./businesses.routes"
import { CancelBookingRoutes } from "./cancel-booking.route"
import { MarketplaceRoutes } from "./marketplace.routes"
import { PasswordResetRoutes } from "./password-reset.routes"
import { RefreshTokenRoutes } from "./refresh-token.routes"
import { BusinessSettingsRoutes } from "./business-settings.routes";


export abstract class BaseRoutes {
	public static basePath = '/api'

	public static addChildRoutes(): Router {
		const router = Router()
		BaseRoutes.addRoutes(router)
		return router
	}

	private static addRoutes(router: Router): void {
		router.use(AuthenticateRoutes.authenticatePath, AuthenticateRoutes.addAuthenticateRoutes())
		router.use(PasswordResetRoutes.passwordResetPath, PasswordResetRoutes.addPasswordResetRoutes())
		router.use(RefreshTokenRoutes.refreshTokenPath, RefreshTokenRoutes.addRefreshTokenRoutes())
		router.use(BusinessesRoutes.businessesPath, BusinessesRoutes.addBusinessesRoutes())
		router.use(BusinessBookingsRoutes.businessBookingsPath, AuthMiddleware.getAuthFunction(), BusinessBookingsRoutes.addBusinessBookingsRoutes())
		router.use(BusinessServiceBookingsRoutes.businessServiceBookingsPath, BusinessServiceBookingsRoutes.addBusinessServiceBookingsRoutes())
		router.use(BusinessBusinessServicesRoutes.businessBusinessServicesPath, AuthMiddleware.getAuthFunction(), BusinessBusinessServicesRoutes.addBusinessBusinessServicesRoutes())
		router.use(BusinessServicesCategoriesRoutes.businessServiceCategoriesPath, AuthMiddleware.getAuthFunction(), BusinessServicesCategoriesRoutes.addBusinessServicesCategoriesRoutes())
		router.use(BusinessTypesRoutes.businessTypesPath, AuthMiddleware.getAuthFunction(), BusinessTypesRoutes.addBusinessTypesRoutes())
		router.use(CancelBookingRoutes.cancelBookingPath, CancelBookingRoutes.addCancelBookingRoutes())
		router.use(ActivateAccountRoutes.activateAccountPath, ActivateAccountRoutes.addActivateAccountRoutes())
		router.use(MarketplaceRoutes.marketplacePath, MarketplaceRoutes.addMobileRoutes())
		router.use(BusinessSettingsRoutes.businessSettingPath, BusinessSettingsRoutes.addBusinessTypesRoutes())

	}
}