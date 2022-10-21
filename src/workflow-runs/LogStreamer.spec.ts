import { Observable } from 'rxjs';
import { LogStreamer } from './LogStreamer';

describe('LogStreamer', () => {
	it('should stream log from string', () => {
		const log = 'test log';
		const logStreamer = new LogStreamer(log);
		const logStream = logStreamer.stream;
		const logStreamSubscriber = jest.fn();
		logStream.subscribe(logStreamSubscriber);
		expect(logStreamSubscriber).toBeCalledWith(JSON.stringify({ type: 'next', message: log }));
		expect(logStreamSubscriber).toBeCalledWith(JSON.stringify({ type: 'complete', message: '' }));
	});

	it('should stream log from observable with ok result', () => {
		const log = 'test log';
		const logStreamer = new LogStreamer(
			new Observable(subscriber => {
				subscriber.next(log);
				subscriber.complete();
			}),
		);
		const logStream = logStreamer.stream;
		const logStreamSubscriber = jest.fn();
		logStream.subscribe(logStreamSubscriber);
		expect(logStreamSubscriber).toBeCalledWith(JSON.stringify({ type: 'next', message: log }));
		expect(logStreamSubscriber).toHaveBeenLastCalledWith(JSON.stringify({ type: 'complete', message: '' }));
	});

	it('should stream log from observable with error result', () => {
		const log = 'test log';
		const logStreamer = new LogStreamer(
			new Observable(subscriber => {
				subscriber.next(log);
				subscriber.error({ name: 'test error' });
			}),
		);
		const logStream = logStreamer.stream;
		const logStreamSubscriber = jest.fn();
		logStream.subscribe(logStreamSubscriber);
		expect(logStreamSubscriber).toBeCalledWith(JSON.stringify({ type: 'next', message: log }));
		expect(logStreamSubscriber).toHaveBeenLastCalledWith(
			JSON.stringify({ type: 'error', message: JSON.stringify({ name: 'test error' }) }),
		);
	});
});
