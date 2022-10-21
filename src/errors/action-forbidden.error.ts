import { BaseError } from "./base.error"

export class ActionForbiddenError extends BaseError {

	public static httpCode = 403

	constructor(
		public message: string,
		public sendErrMsgToCaller: boolean = false
	) {
		super(message, ActionForbiddenError.httpCode, sendErrMsgToCaller)
	}
}