import { PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

export class DiscriminatorPipe implements PipeTransform {
	constructor(
		private readonly discr: {
			discriminator: string;
			map: Record<string, any>;
		},
	) {}

	transform(value: any) {
		return plainToInstance(this.discr.map[value[this.discr.discriminator]], value);
	}
}
