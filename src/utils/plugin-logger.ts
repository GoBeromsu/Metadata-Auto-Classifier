import { redactLogPayload, sanitizeErrorMessage } from './log-redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class PluginLogger {
	constructor(
		private readonly prefix: string,
		private readonly isDebug: () => boolean = () => false
	) {}

	debug(message: string, data?: Record<string, unknown>): void {
		if (!this.isDebug()) return;
		console.debug(this.format('debug', message, data));
	}

	info(message: string, data?: Record<string, unknown>): void {
		console.debug(this.format('info', message, data));
	}

	warn(message: string, data?: Record<string, unknown>): void {
		console.warn(this.format('warn', message, data));
	}

	error(message: string, error?: unknown): void {
		const detail = this.formatError(error);
		console.error(`[${this.prefix}] error | ${message}${detail}`);
	}

	/**
	 * Backward-compatible alias retained for existing call sites/tests.
	 * This repo-local logger no longer depends on Obsidian notices directly.
	 */
	noticeError(message: string, error?: unknown): void {
		this.error(message, error);
	}

	private formatError(error: unknown): string {
		if (error === undefined || error === null) return '';
		if (error instanceof Error) return ` | ${sanitizeErrorMessage(error.message)}`;
		if (typeof error === 'string') return ` | ${sanitizeErrorMessage(error)}`;
		try {
			return ` | ${JSON.stringify(redactLogPayload(error as Record<string, unknown>))}`;
		} catch {
			return ' | [unserializable]';
		}
	}

	private format(level: LogLevel, message: string, data?: Record<string, unknown>): string {
		const safeData = data ? redactLogPayload(data) : undefined;
		const pairs = safeData
			? ` | ${Object.entries(safeData)
					.map(([k, v]) => `${k}=${JSON.stringify(v)}`)
					.join(' ')}`
			: '';
		return `[${this.prefix}] ${level.padEnd(5)} | ${message}${pairs}`;
	}
}
