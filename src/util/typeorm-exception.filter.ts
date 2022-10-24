import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

/**
 * Exception filter to handle EntityNotFoundError thrown by TpeORM
 */
@Catch(EntityNotFoundError)
export class TypeormNotFoundExceptionFilter implements ExceptionFilter {
	catch(exception: EntityNotFoundError, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<Response>();
		const status = HttpStatus.NOT_FOUND;

		response.status(status).json({
			statusCode: status,
			message: exception.message,
			error: exception.name,
		});
	}
}

/**
 * Exception filter to handle QueryFailedError thrown by TpeORM
 */
@Catch(QueryFailedError)
export class TypeormQueryFailedExceptionFilter implements ExceptionFilter {
	catch(exception: QueryFailedError, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<Response>();
		const status = HttpStatus.BAD_REQUEST;

		response.status(status).json({
			statusCode: status,
			message: exception.message,
			error: exception.name,
		});
	}
}
