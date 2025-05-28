export class ApiError extends Error {
	status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = '';
		this.status = status;
	}
}
