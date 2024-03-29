export const zip = <A, B, T>(as: A[], bs: B[], acc: (a: A, b: B) => T) =>
	as
		.map((a, i) => ({ a, b: bs[i] }))
		.slice(0, Math.min(as.length, bs.length))
		.map(({ a, b }) => acc(a, b));
