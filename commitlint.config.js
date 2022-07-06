module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'scope-case': [0, 'always', 'lower-case'],
	},
	ignores: [commit => commit.includes('Initial commit')],
};
