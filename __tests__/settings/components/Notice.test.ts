import { Notice as SettingsNotice } from 'settings/components/Notice';
import { Notice } from 'obsidian';

(global as any).window = global;

describe('Notice', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('error shows error notice and logs', () => {
		const err = new Error('boom');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		SettingsNotice.error(err);
		expect(Notice).toHaveBeenCalledWith('❌ boom', 5000);
		expect(log).toHaveBeenCalledWith(err);
	});

	test('success shows success notice', () => {
		SettingsNotice.success('ok');
		expect(Notice).toHaveBeenCalledWith('ok', 3000);
	});

	test('startProgress and endProgress manage notice', () => {
		vi.useFakeTimers();
		const notice: any = SettingsNotice.startProgress('Task');
		expect(Notice).toHaveBeenCalledWith(expect.stringContaining('Task'), 0);
		expect(notice.interval).toBeDefined();
		vi.advanceTimersByTime(200);
		expect(notice.setMessage).toHaveBeenCalled();
		SettingsNotice.endProgress(notice);
		expect(notice.hide).toHaveBeenCalled();
		vi.useRealTimers();
	});

	test('withProgress wraps async function with progress notice', async () => {
		vi.useFakeTimers();
		const fn = vi.fn().mockResolvedValue('done');
		const promise = SettingsNotice.withProgress('file.md', 'tags', fn);
		const result = await promise;
		expect(result).toBe('done');
		expect(fn).toHaveBeenCalled();
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});
});
