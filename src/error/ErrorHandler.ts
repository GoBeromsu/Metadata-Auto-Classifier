import { Notice } from 'obsidian';
import { ApiError } from './ApiError';
import { ApiHandler } from './api/ApiHandler';

export class ErrorHandler {
	private static formatErrorMessage(error: Error, context: string): string {
		if (error instanceof ApiError) {
			return `API Error (${error.status}): ${error.message} in ${context}`;
		}
		return `Error: ${error.message} in ${context}`;
	}

	static handle(error: Error, context: string): void {
		console.error(`${context}:`, error);
		const message = this.formatErrorMessage(error, context);
		new Notice(message);
	}
}
