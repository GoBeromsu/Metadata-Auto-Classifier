import { Notice } from 'obsidian';

export class CommonNotice {
	private static formatErrorMessage(error: Error, context: string): string {
		return `Error: ${error.message} in ${context}`;
	}

	static showError(error: Error, context: string): void {
		const message = this.formatErrorMessage(error, context);
		new Notice(message);
	}

	static showSuccess(message: string): void {
		new Notice(message);
	}

	static showWarning(message: string): void {
		new Notice(message);
	}

	static showInfo(message: string): void {
		new Notice(message);
	}
}
