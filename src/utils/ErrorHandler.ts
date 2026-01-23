import { CommonNotice } from 'ui/components/common/CommonNotice';

/**
 * Centralized error handling utility for consistent error management across the application.
 */
export class ErrorHandler {
	/**
	 * Handle API-related errors with appropriate logging and user notification.
	 */
	static handleAPIError(error: Error, context?: string): void {
		const message = context ? `[API] ${context}: ${error.message}` : `[API] ${error.message}`;
		console.error(message, error);
		CommonNotice.error(new Error(message));
	}

	/**
	 * Handle validation errors with component context.
	 */
	static handleValidationError(component: string, message: string): void {
		CommonNotice.validationError(component, message);
	}

	/**
	 * Handle unexpected errors with logging.
	 */
	static handleUnexpectedError(error: unknown, context?: string): void {
		const errorObj = error instanceof Error ? error : new Error(String(error));
		const message = context
			? `[Unexpected] ${context}: ${errorObj.message}`
			: `[Unexpected] ${errorObj.message}`;

		console.error(message, error);
		CommonNotice.error(new Error(message));
	}

	/**
	 * Wrap an async function with error handling.
	 */
	static async wrapAsync<T>(
		fn: () => Promise<T>,
		context?: string
	): Promise<T | null> {
		try {
			return await fn();
		} catch (error) {
			this.handleUnexpectedError(error, context);
			return null;
		}
	}

	/**
	 * Create a safe wrapper for callbacks that shouldn't throw.
	 */
	static safeCallback<T extends (...args: unknown[]) => void>(
		fn: T,
		context?: string
	): T {
		return ((...args: unknown[]) => {
			try {
				fn(...args);
			} catch (error) {
				this.handleUnexpectedError(error, context);
			}
		}) as T;
	}
}
