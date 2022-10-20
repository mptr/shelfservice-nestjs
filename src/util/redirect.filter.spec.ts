import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { RedirectFilter, Redirection } from './redirect.filter';

describe('RedirectFilter', () => {
	it('Redirection should be a throwable', () => {
		expect(() => {
			throw new Redirection('dst/path', 301);
		}).toThrow();
	});

	it('should be defined', () => {
		expect(new RedirectFilter()).toBeDefined();
	});

	it('should perform redirection on exception', () => {
		const mockResponse = {
			redirect: jest.fn(),
		} as unknown as Response;
		const mockHost = {
			switchToHttp: () => ({
				getResponse: () => mockResponse,
			}),
		} as unknown as ArgumentsHost;
		const filter = new RedirectFilter();
		filter.catch(new Redirection('dst/path', 301), mockHost);
		expect(mockResponse.redirect).toHaveBeenCalledWith(301, 'dst/path');
	});
});
