import { Request } from 'express';
import { v4 } from 'uuid';
import { ShelfAliasController } from './shelf-alias.controller';

describe('ShelfAliasController ', () => {
	const controller = new ShelfAliasController();

	const nextResultMock = v4();
	const nextMock = jest.fn().mockReturnValue(nextResultMock);

	test.each([
		['/shelf', '/workflows'],
		['/shelf/', '/workflows/'],
		['/shelf/id', '/workflows/id'],
		['shelf', 'shelf'],
		['shelf/', 'shelf/'],
		['/base/shelf/', '/base/shelf/'],
		['/shlf', '/shlf'],
	])('should replace in route %#', (from, to) => {
		const reqMock = { url: from };
		expect(controller.replaceSelf(reqMock as unknown as Request, nextMock)).toBe(nextResultMock);
		expect(reqMock.url).toBe(to);
	});
});
