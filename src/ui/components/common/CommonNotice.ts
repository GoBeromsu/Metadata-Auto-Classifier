import { Notice } from 'obsidian';

export class CommonNotice {
	private static show(message: string, duration: number): void {
		new Notice(message, duration);
	}

	static error(error: Error): void {
		this.show(`❌ ${error.message}`, 5000);
	}

	static success(message: string): void {
		this.show(`✅ ${message}`, 3000);
	}

	static warning(message: string): void {
		this.show(`⚠️ ${message}`, 4000);
	}

	static info(message: string): void {
		this.show(`ℹ️ ${message}`, 3000);
	}
}
