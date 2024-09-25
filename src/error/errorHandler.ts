import { Notice } from 'obsidian';
import { APIError } from './apiError';

export class ErrorHandler {
	private static formatErrorMessage(error: Error, context: string): string {
		if (error instanceof APIError) {
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
