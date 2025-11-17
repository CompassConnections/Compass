module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    testPathIgnorePatterns: [
        // '/node_modules/',
        // '/dist/',
        // '/coverage/',
        '/tests/e2e',
        // '/lib/',
        // 'backend/email/emails/test.ts',
        'common/src/socials.test.ts',
        // 'backend/api/src',
        // 'martin',
    ],
    projects: [
        "<rootDir>/backend/api",
        "<rootDir>/backend/shared",
        "<rootDir>/backend/email",
        "<rootDir>/common",
        "<rootDir>/web"
    ],
};
