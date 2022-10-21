import { BaseError } from "./base.error"

export class InvalidTokenError extends BaseError {

	public static httpCode = 401

	constructor(
		public message: string,
		public sendErrMsgToCaller: boolean = false
	) {
		super(message, InvalidTokenError.httpCode, sendErrMsgToCaller)
	}
}