import * as express from "express"
import * as cors from "cors"
import helmet from "helmet"

import { HttpErrorCodeResolver } from "./errors/http-error-code-resolver"
import { BaseRoutes } from "./routes/base.routes"
import { ErrorMessage } from "./types/error-message"
import { BaseError } from "./errors/base.error"

export abstract class App {
	public static createApp() {
		const app = express()

		app.use(helmet())
		app.use(express.json())
		app.use(cors({
			origin: process.env.CORS_ORIGIN.split(','),
			methods: "GET,POST,PUT,PATCH,DELETE"
		}))
		app.use(BaseRoutes.basePath, BaseRoutes.addChildRoutes())
		app.use((err: BaseError, req, res, next) => {
			const httpErrorCode = HttpErrorCodeResolver.resolveError(err)
			const response = res.status(httpErrorCode)
			if (err.sendErrMsgToCaller == true && err.message != null && err.message != '') {
				response.json(new ErrorMessage(err.message))
				return
			}
			response.send()
		})

		return app
	}
}