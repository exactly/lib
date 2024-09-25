/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: { project: ["tsconfig.json", "tsconfig.dev.json"] },
  settings: { "import/resolver": { typescript: true }, jest: { version: "latest" } },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:@eslint-community/eslint-plugin-eslint-comments/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:n/recommended",
    "plugin:prettier/recommended",
    "plugin:unicorn/recommended",
    "universe/node",
  ],
  rules: {
    "@eslint-community/eslint-comments/no-unused-disable": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/no-shadow": "error",
    "import/prefer-default-export": "error",
    "no-console": "warn",
    "no-restricted-imports": ["error", { patterns: ["./server/"] }],
    "no-shadow": "off", // @typescript-eslint/no-shadow
    "unicorn/filename-case": "off", // use default export name
    "unicorn/no-useless-undefined": ["error", { checkArrowFunctionBody: false }], // @typescript-eslint/no-empty-function
    "unicorn/number-literal-case": "off", // incompatible with prettier
    "unicorn/switch-case-braces": ["error", "avoid"], // consistently avoid braces
  },
  overrides: [
    {
      files: ["test/**"],
      extends: ["plugin:@vitest/legacy-all"],
      rules: {
        "@vitest/max-expects": "off",
        "@vitest/no-hooks": "off",
        "@vitest/prefer-expect-assertions": [
          "warn",
          { onlyFunctionsWithExpectInLoop: true, onlyFunctionsWithExpectInCallback: true },
        ],
      },
    },
  ],
  ignorePatterns: ["dist/", "coverage/", "generated/"],
};
