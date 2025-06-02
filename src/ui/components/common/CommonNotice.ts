import { Notice } from 'obsidian';

export class CommonNotice {
	static showError(error: Error): void {
		new Notice(`❌ ${error.message}`, 5000);
	}

	static showSuccess(message: string): void {
		new Notice(`✅ ${message}`, 3000);
	}

	static showWarning(message: string): void {
		new Notice(`⚠️ ${message}`, 4000);
	}

	static showInfo(message: string): void {
		new Notice(`ℹ️ ${message}`, 3000);
	}
}
