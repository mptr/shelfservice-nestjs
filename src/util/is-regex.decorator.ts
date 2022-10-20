import {
	registerDecorator,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint()
class IsRegexConstraint implements ValidatorConstraintInterface {
	validate(value: any): boolean {
		try {
			new RegExp(value);
			return true;
		} catch (e) {
			return false;
		}
	}
}

export const IsRegEx = (options?: ValidationOptions) => {
	return (object: Object, propertyName: string) => {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options,
			constraints: [],
			validator: IsRegexConstraint,
		});
	};
};
