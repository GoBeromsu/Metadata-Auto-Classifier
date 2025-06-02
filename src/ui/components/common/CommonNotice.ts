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

	static startProgress(displayText: string): Notice & { interval?: number } {
		const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
		let spinIndex = 0;

		const noticeText = () => `${spinChars[spinIndex]} ${displayText}`;
		const notice = new Notice(noticeText(), 0) as Notice & { interval?: number };

		notice.interval = window.setInterval(() => {
			spinIndex = (spinIndex + 1) % spinChars.length;
			notice.setMessage(noticeText());
		}, 100);

		return notice;
	}

	static endProgress(notice: Notice & { interval?: number }): void {
		if (notice.interval) {
			clearInterval(notice.interval);
		}
		notice.hide();
	}

	static async withProgress<T>(
		fileName: string,
		frontmatterName: string,
		fn: () => Promise<T>
	): Promise<T> {
		const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
		const progressNotice = this.startProgress(`Tagging ${fileNameWithoutExt} (${frontmatterName})`);
		try {
			const result = await fn();
			return result;
		} finally {
			this.endProgress(progressNotice);
		}
	}
}
