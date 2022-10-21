export class Attachment {

	constructor(
			public content: string,
			public filename: string,
			public type: string,
			public disposition = 'attachment') {}
}