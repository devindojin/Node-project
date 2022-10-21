import { BaseError } from "./base.error"

export class ResourceAlreadyExistsError extends BaseError {

	public static httpCode = 409

	constructor(
		public message: string,
		public sendErrMsgToCaller: boolean = false
	) {
		super(message, ResourceAlreadyExistsError.httpCode, sendErrMsgToCaller)
	}
}