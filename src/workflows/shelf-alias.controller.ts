import { All, Controller, Next, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NextFunction, Request } from 'express';

@Controller()
@ApiTags('shelf-alias')
@ApiBearerAuth('kc-token')
export class ShelfAliasController {
	@ApiResponse({ status: 200 })
	@All(['/shelf*', '/shelf/*'])
	replaceSelf(@Req() req: Request, @Next() next: NextFunction) {
		req.url = req.url.replace(/^\/shelf(.*)/, `/workflows$1`);
		return next();
	}
}
