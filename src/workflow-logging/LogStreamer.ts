import { map, Observable, Observer, Subscriber } from 'rxjs';

class LogMessage {
	constructor(public readonly type: keyof Observer<string>, public message: string = '') {}
}

export class LogStreamer {
	private source: Observable<string>;

	constructor(source: Observable<string>);
	constructor(log: string);
	constructor(s: Observable<string> | string) {
		console.log('creat stream for', s);
		if (typeof s === 'string') {
			this.source = new Observable<string>(subscriber => {
				subscriber.next(s);
				subscriber.complete();
			});
		} else this.source = s;
	}

	get stream() {
		return new Observable((subscriber: Subscriber<LogMessage>) => {
			const sub = this.source.subscribe({
				next: (message: string) => subscriber.next(new LogMessage('next', message)),
				complete: () => subscriber.next(new LogMessage('complete')),
				error: (e: any) => subscriber.next(new LogMessage('error', JSON.stringify(e))),
			});
			return () => sub.unsubscribe();
		}).pipe(map(x => JSON.stringify(x)));
	}
}
