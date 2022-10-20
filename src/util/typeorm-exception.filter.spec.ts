import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { TypeormNotFoundExceptionFilter, TypeormQueryFailedExceptionFilter } from './typeorm-exception.filter';

describe('TypeormNotFoundExceptionFilter', () => {
	it('should be defined', () => {
		expect(new TypeormNotFoundExceptionFilter()).toBeDefined();
	});

	it('should return 404 on EntityNotFoundError', () => {
		const mockResponse = {
			status: jest.fn().mockImplementation(() => mockResponse),
			json: jest.fn().mockImplementation(() => mockResponse),
		} as unknown as Response;
		const mockHost = {
			switchToHttp: () => ({
				getResponse: () => mockResponse,
			}),
		} as unknown as ArgumentsHost;
		const filter = new TypeormNotFoundExceptionFilter();
		filter.catch(new EntityNotFoundError('Foo', 'bar'), mockHost);
		expect(mockResponse.status).toHaveBeenCalledWith(404);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 404,
			message: 'Could not find any entity of type "Foo" matching: "bar"',
			error: 'EntityNotFoundError',
		});
	});
});

describe('TypeormQueryFailedExceptionFilter', () => {
	it('should be defined', () => {
		expect(new TypeormQueryFailedExceptionFilter()).toBeDefined();
	});

	it('should return 400 on QueryFailedError', () => {
		const mockResponse = {
			status: jest.fn().mockImplementation(() => mockResponse),
			json: jest.fn().mockImplementation(() => mockResponse),
		} as unknown as Response;
		const mockHost = {
			switchToHttp: () => ({
				getResponse: () => mockResponse,
			}),
		} as unknown as ArgumentsHost;
		const filter = new TypeormQueryFailedExceptionFilter();
		filter.catch(new QueryFailedError('foo', ['p1'], 'bar'), mockHost);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 400,
			error: 'QueryFailedError',
			message: 'bar',
		});
	});
});
