import { map, Observable, Observer, Subscriber } from 'rxjs';

class LogMessage {
	constructor(public readonly type: keyof Observer<string>, public message: string = '') {}
}

export class LogStreamer {
	private source: Observable<string>;
	private blacklist: string[] = [];

	constructor(source: Observable<string>, blacklist?: string[]);
	constructor(log: string, blacklist?: string[]);
	constructor(s: Observable<string> | string, blacklist: string[] = []) {
		console.log('creat stream for', s);
		if (typeof s === 'string') {
			this.source = new Observable<string>(subscriber => {
				subscriber.next(s);
				subscriber.complete();
			});
		} else this.source = s;
		// store all blacklist strings line by line
		if (blacklist) this.blacklist = blacklist.flatMap(x => x.split('\n').map(x => x.trim()));
	}

	get stream() {
		return new Observable((subscriber: Subscriber<LogMessage>) => {
			const sub = this.source.subscribe({
				next: (message: string) => subscriber.next(new LogMessage('next', message)),
				complete: () => subscriber.next(new LogMessage('complete')),
				error: (e: any) => subscriber.next(new LogMessage('error', JSON.stringify(e))),
			});
			return () => sub.unsubscribe();
		}).pipe(
			map(x => {
				x.message = x.message
					// analyze each line of the message
					.split('\n')
					.map(line => {
						// replace all blacklist matches
						return this.blacklist.reduce((acc, cur) => acc.replace(cur, '*****'), line);
					})
					// rebuild the message
					.join('\n');
				return x;
			}),
			map(x => JSON.stringify(x)),
		);
	}
}
