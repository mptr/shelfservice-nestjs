import { Transform } from 'class-transformer';

export const Trim = () => Transform(({ value }) => (value as string).trim(), { toClassOnly: true });
