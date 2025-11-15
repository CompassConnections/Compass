module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    rootDir: '.',
    testMatch: [
        "<rootDir>/tests/**/*.test.ts",
        "<rootDir>/tests/**/*.spec.ts"
    ],

    moduleNameMapper: {
        "^api/(.*)$": "<rootDir>/src/$1",
        "^shared/(.*)$": "<rootDir>/../shared/src/$1",
        "^common/(.*)$": "<rootDir>/../../common/src/$1",
        "^email/(.*)$": "<rootDir>/../email/emails/$1"
    },

    moduleFileExtensions: ["ts", "js", "json"],
    clearMocks: true,

    globals: {
        'ts-jest': {
            tsconfig: "<rootDir>/tsconfig.test.json"
        }
    },

    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts"
    ],
};
