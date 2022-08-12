import { V1EnvVar } from '@kubernetes/client-node';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
	IsBoolean,
	isBooleanString,
	isDateString,
	IsEnum,
	isNumberString,
	IsOptional,
	isString,
	IsString,
} from 'class-validator';
import { IsRegEx } from 'src/util/IsRegex';

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

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	hint?: string;

	@IsString()
	displayName: string;

	@IsRegEx()
	@IsOptional()
	pattern?: string;

	@IsBoolean()
	@IsOptional()
	required = false;

	accept(from: Record<string, string>): SetParameter {
		[
			{
				cond: () => this.required && from[this.name] === undefined,
				err: `Parameter ${this.name} not found but is required`,
			},
			{
				cond: () => !validators[this.kind](from[this.name]),
				err: `Parameter ${this.name} is not of type ${this.kind}`,
			},
			{
				cond: () => this.required && this.pattern && !new RegExp(this.pattern).test(from[this.name]),
				err: `Parameter ${this.name} does not match required pattern.`,
			},
		].forEach(({ cond, err }) => {
			if (cond()) throw new HttpException(err, HttpStatus.UNPROCESSABLE_ENTITY);
		});
		return { ...this, value: from[this.name] };
	}
}

export class SetParameter extends Parameter implements V1EnvVar {
	value: string;
}
