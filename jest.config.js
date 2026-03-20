// jest.config.js
// ts-jest を直接使用し、Next.js に依存しない純粋なテスト環境を構成する

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/dictionary/types$": "<rootDir>/src/dictionary/types.ts",
    "^@/dictionary$":       "<rootDir>/src/dictionary/index.ts",
    "^@/store$":            "<rootDir>/src/store/store.ts",
    "^@/(.*)$":             "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        // ts-jest 用に jsx と module を調整
        jsx: "react",
        module: "commonjs",
        esModuleInterop: true,
      },
    }],
  },
};
