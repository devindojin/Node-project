export class BaseError extends Error {
	constructor(
			public message: string,
			public httpCode: number,
			public sendErrMsgToCaller: boolean = false) {
		super(message)
	}
}