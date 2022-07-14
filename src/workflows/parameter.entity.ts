import { V1EnvVar } from '@kubernetes/client-node';
import { HttpException, HttpStatus } from '@nestjs/common';
import { isBooleanString, isDateString, IsEnum, isNumberString, isString, IsString } from 'class-validator';

export enum ParameterKind {
	String = 'string',
	Number = 'number',
	Boolean = 'boolean',
	Date = 'date',
}
const validators: Record<ParameterKind, (value: any) => boolean> = {
	[ParameterKind.String]: isString,
	[ParameterKind.Number]: isNumberString,
	[ParameterKind.Boolean]: isBooleanString,
	[ParameterKind.Date]: isDateString,
};

export class Parameter {
	constructor(p: Partial<Parameter>) {
		Object.assign(this, p);
	}

	@IsString()
	name: string;
	@IsEnum(ParameterKind)
	kind: ParameterKind;

	accept(from: Record<string, string>): SetParameter {
		if (from[this.name] === undefined)
			throw new HttpException(`Parameter ${this.name} not found`, HttpStatus.UNPROCESSABLE_ENTITY);
		if (!validators[this.kind](from[this.name]))
			throw new HttpException(`Parameter ${this.name} is not of type ${this.kind}`, HttpStatus.UNPROCESSABLE_ENTITY);
		return { ...this, value: from[this.name] };
	}
}

export class SetParameter extends Parameter implements V1EnvVar {
	value: string;
}
