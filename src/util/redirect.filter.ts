import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export class Redirection extends Error {
	constructor(public readonly url: string, public readonly status: number = HttpStatus.FOUND) {
		super();
	}
}

@Catch(Redirection)
export class RedirectFilter implements ExceptionFilter {
	public catch(exception: Redirection, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		return response.redirect(exception.status, exception.url);
	}
}
