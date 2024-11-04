export class ApiError extends Error {
	constructor(message: string, public status?: number, public originalError?: any) {
		super(message);
		this.name = 'APIError';
	}
}
