/* eslint-disable */
export default {
  displayName: "scripts",
  preset: "../../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  testPathIgnorePatterns: ["dist"],
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/packages/scripts",
};
