module.exports = {
	'env': {
		'browser': true,
		'es2021': true,
	},
	'extends': [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended'
	],
	'overrides': [
	],
	'parser': '@typescript-eslint/parser',
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	'plugins': [
		'svelte3',
		'@typescript-eslint'
	],
	overrides: [
		{
			files: ['**/*.svelte'],
			processor: 'svelte3/svelte3'
		}
	],
	'ignorePatterns': ['.eslintrc.cjs', 'dist/**/*'],
	'rules': {
		'@typescript-eslint/indent': ['warn', 'tab'],
		'linebreak-style': ['warn', 'unix'],
		'@typescript-eslint/quotes': ['warn', 'single'],
		'@typescript-eslint/semi': ['warn', 'always'],
		'no-constant-condition': ['warn', { checkLoops: false }],
		'@typescript-eslint/comma-dangle': ['warn', 'never'],
		'@typescript-eslint/no-explicit-any': ['off'],
		'eqeqeq': ['error', 'always'],
		'no-trailing-spaces': ['warn'],
		'max-len': ['warn', { code: 120, ignoreStrings: false }],
		'no-undef': ['off']
	},
	settings: {
		'svelte3/typescript': true
	}
};
