import { CommonNotice } from '../../src/ui/components/common/CommonNotice';
import { Notice } from 'obsidian';

(global as any).window = global;

describe('CommonNotice', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('error shows error notice and logs', () => {
		const err = new Error('boom');
		const log = jest.spyOn(console, 'error').mockImplementation(() => {});
		CommonNotice.error(err);
		expect(Notice).toHaveBeenCalledWith('❌ boom', 5000);
		expect(log).toHaveBeenCalledWith(err);
	});

	test('success shows success notice', () => {
		CommonNotice.success('ok');
		expect(Notice).toHaveBeenCalledWith('ok', 3000);
	});

	test('startProgress and endProgress manage notice', () => {
		jest.useFakeTimers();
		const notice: any = CommonNotice.startProgress('Task');
		expect(Notice).toHaveBeenCalledWith(expect.stringContaining('Task'), 0);
		expect(notice.interval).toBeDefined();
		jest.advanceTimersByTime(200);
		expect(notice.setMessage).toHaveBeenCalled();
		CommonNotice.endProgress(notice);
		expect(notice.hide).toHaveBeenCalled();
		jest.useRealTimers();
	});

	test('withProgress wraps async function with progress notice', async () => {
		jest.useFakeTimers();
		const fn = jest.fn().mockResolvedValue('done');
		const promise = CommonNotice.withProgress('file.md', 'tags', fn);
		const result = await promise;
		expect(result).toBe('done');
		expect(fn).toHaveBeenCalled();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});
});
