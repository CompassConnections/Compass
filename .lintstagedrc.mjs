export default {
  'web/**/*.{ts,tsx,js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `eslint --config web/eslint.config.mjs --fix ${files.join(' ')}`,
    `eslint --config web/eslint.config.mjs --max-warnings 0 ${files.join(' ')}`,
  ],
  'common/**/*.{ts,tsx,js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `eslint --config common/eslint.config.mjs --fix ${files.join(' ')}`,
    `eslint --config common/eslint.config.mjs --max-warnings 0 ${files.join(' ')}`,
  ],
  'backend/api/**/*.{ts,tsx,js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `eslint --config backend/api/eslint.config.mjs --fix ${files.join(' ')}`,
    `eslint --config backend/api/eslint.config.mjs --max-warnings 0 ${files.join(' ')}`,
  ],
  'backend/shared/**/*.{ts,tsx,js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `eslint --config backend/shared/eslint.config.mjs --fix ${files.join(' ')}`,
    `eslint --config backend/shared/eslint.config.mjs --max-warnings 0 ${files.join(' ')}`,
  ],
  'backend/email/**/*.{ts,tsx,js,jsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    `eslint --config backend/email/eslint.config.mjs --fix ${files.join(' ')}`,
    `eslint --config backend/email/eslint.config.mjs --max-warnings 0 ${files.join(' ')}`,
  ],
  '**/*.{json,css,scss,md}': (files) => [`prettier --write ${files.join(' ')}`],
}
