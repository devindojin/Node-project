import { Attachment } from "./attachment"
import { Person } from "./person"
import { Personalization } from "./personalizations"

export class Message {

	constructor(
			public personalizations: Personalization[],
			public from: Person,
			public attachments: Attachment[],
			public template_id: string) {}
}