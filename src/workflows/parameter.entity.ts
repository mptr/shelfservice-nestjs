import { V1EnvVar } from '@kubernetes/client-node';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
	Allow,
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
import { Discriminator } from 'src/util/json-column.decorator';

export enum ParameterType {
	STRING = 'string',
	SELECT = 'select',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	DATE = 'date',
}
const validators: Record<ParameterType, (value: any) => boolean> = {
	[ParameterType.STRING]: isString,
	[ParameterType.SELECT]: isString,
	[ParameterType.NUMBER]: isNumberString,
	[ParameterType.BOOLEAN]: isBooleanString,
	[ParameterType.DATE]: isDateString,
};

type ParamValidator = {
	cond: (from: Record<string, string>) => boolean;
	err: string;
};
export class Parameter {
	static get discriminator(): Discriminator<Parameter, 'kind'> {
		return {
			property: 'kind',
			subTypes: [
				{ name: ParameterType.STRING, value: StringParameter },
				{ name: ParameterType.SELECT, value: SelectParameter },
				{ name: ParameterType.NUMBER, value: NumberParameter },
				{ name: ParameterType.BOOLEAN, value: BooleanParameter },
				{ name: ParameterType.DATE, value: DateParameter },
			],
		};
	}
	constructor(p: Partial<Parameter>) {
		Object.assign(this, p);
	}

	@IsString()
	name: string;

	@IsEnum(ParameterType)
	kind: ParameterType;

	@IsString()
	@IsOptional()
	description: string = null;

	@IsString()
	displayName: string;

	get acceptConditions(): ParamValidator[] {
		return [
			{
				cond: from => !validators[this.kind](from[this.name]),
				err: `Parameter ${this.displayName} ist nicht vom Typ ${this.kind}`,
			},
		];
	}

	accept(from: Record<string, string>): SetVariable {
		this.acceptConditions.forEach(({ cond, err }) => {
			if (cond(from)) throw new HttpException(err, HttpStatus.UNPROCESSABLE_ENTITY);
		});
		return new SetVariable({ name: this.name, value: from[this.name] });
	}
}
export class RequireableParameter extends Parameter {
	@IsBoolean()
	@IsOptional()
	required = false;

	@IsString()
	@IsOptional()
	hint: string = null;

	@IsBoolean()
	@IsOptional()
	hide = false;

	override get acceptConditions(): ParamValidator[] {
		return super.acceptConditions.concat([
			{
				cond: from => this.required && from[this.name] === undefined,
				err: `Parameter ${this.displayName} ist erforderlich`,
			},
		]);
	}

	override accept(from: Record<string, string>): SetVariable {
		const r = super.accept(from);
		r.hide = this.hide;
		return r;
	}
}
export class StringParameter extends RequireableParameter {
	@IsString()
	@IsOptional()
	exampleValue = '';

	@IsRegEx()
	@IsOptional()
	pattern: string = null;

	@IsBoolean()
	multiline = false;

	@IsBoolean()
	@IsOptional()
	password = false;

	constructor(p: Partial<StringParameter>) {
		super(p);
	}

	override get acceptConditions(): ParamValidator[] {
		return super.acceptConditions.concat([
			{
				cond: from => from[this.name] && this.pattern !== null && !new RegExp(this.pattern).test(from[this.name]),
				err: `Parameter ${this.displayName} passt nicht auf das geforderte Muster.`,
			},
		]);
	}
}
export class SelectParameter extends RequireableParameter {
	@IsString({ each: true })
	options: string[] = [];

	constructor(p: Partial<SelectParameter>) {
		super(p);
	}
}
export class NumberParameter extends RequireableParameter {
	@Allow()
	@Transform(({ value }) => (value ? Number(value) : null))
	min: number = null;

	@Allow()
	@Transform(({ value }) => (value ? Number(value) : null))
	max: number = null;

	@Allow()
	@Transform(({ value }) => (value ? Number(value) : null))
	step: number = null;

	constructor(p: Partial<NumberParameter>) {
		super(p);
	}

	override get acceptConditions(): ParamValidator[] {
		return super.acceptConditions.concat([
			{
				cond: from => from[this.name] !== undefined && this.min !== null && Number(from[this.name]) < this.min,
				err: `Parameter ${this.displayName} ist kleiner als das Minimum von ${this.min}.`,
			},
			{
				cond: from => from[this.name] !== undefined && this.max !== null && Number(from[this.name]) > this.max,
				err: `Parameter ${this.displayName} ist größer als das Maximum von ${this.max}.`,
			},
			{
				cond: from => from[this.name] !== undefined && this.step !== null && Number(from[this.name]) % this.step !== 0,
				err: `Parameter ${this.displayName} ist kein Vielfaches von ${this.step}.`,
			},
		]);
	}
}
export class BooleanParameter extends Parameter {
	constructor(p: Partial<BooleanParameter>) {
		super(p);
	}
}
export class DateParameter extends RequireableParameter {
	constructor(p: Partial<DateParameter>) {
		super(p);
	}
}

export class SetVariable implements V1EnvVar {
	public hide = false;
	public name: string;
	public value: string;

	constructor(p?: { name: string; value: string }) {
		this.name = p?.name;
		this.value = p?.value;
	}
}
