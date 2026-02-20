module.exports = {
  plugins: ['lodash', 'unused-imports', 'simple-import-sort'],
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', 'lib', 'coverage'],
  env: {
    node: true,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
      rules: {
        '@typescript-eslint/no-empty-object-type': 'error', // replaces banning {}
        '@typescript-eslint/no-unsafe-function-type': 'error', // replaces banning Function
        '@typescript-eslint/no-wrapper-object-types': 'error', // replaces banning String, Number, etc.
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extra-semi': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        'unused-imports/no-unused-imports': 'warn',
        'no-constant-condition': 'off',
      },
    },
    {
      files: ['**/fixtures/**/*.ts'],
      rules: {
        'no-empty-pattern': 'off',
      },
    },
  ],
  rules: {
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
    'lodash/import-scope': [2, 'member'],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
}
