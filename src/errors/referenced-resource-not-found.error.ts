import { BaseError } from "./base.error"

export class ReferencedResourceNotFoundError extends BaseError {

	public static httpCode = 404

	constructor(
		public message: string,
		public sendErrMsgToCaller: boolean = false
	) {
		super(message, ReferencedResourceNotFoundError.httpCode, sendErrMsgToCaller)
	}
}