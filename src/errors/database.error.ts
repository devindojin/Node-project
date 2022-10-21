import { BaseError } from "./base.error"

export class DatabaseError extends BaseError {

	public static httpCode = 500

	constructor(
			public message: string) {
		super(message, DatabaseError.httpCode, false)
	}
}