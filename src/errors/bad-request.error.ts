import { BaseError } from "./base.error"

export class BadRequestError extends BaseError {

	public static httpCode = 400

	constructor(
			public message: string,
			public sendErrMsgToCaller: boolean = false) {
		super(message, BadRequestError.httpCode, sendErrMsgToCaller)
	}
}