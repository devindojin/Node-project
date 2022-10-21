import { Person } from "./person"

export class Personalization {

	constructor(
		public to: Person[],
		public bcc: Person[],
		public dynamic_template_data: Object) {}
}