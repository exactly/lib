/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: { project: ["tsconfig.json", "tsconfig.dev.json"] },
  settings: {
    "import/resolver": { typescript: true },
    jest: { version: "latest" },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:eslint-comments/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "plugin:unicorn/recommended",
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/no-shadow": "error",
    "eslint-comments/no-unused-disable": "error",
    "import/prefer-default-export": "error",
    "no-console": "error",
    "no-shadow": "off", // @typescript-eslint/no-shadow
    "unicorn/filename-case": "off", // use default export name
    "unicorn/number-literal-case": "off", // incompatible with prettier
  },
  overrides: [
    { files: "src/**/*", extends: "plugin:require-extensions/recommended" },
    { files: "test/**/*", extends: "plugin:jest/recommended" },
    {
      files: [".eslintrc.*", "test/**/*"],
      extends: "plugin:node/recommended",
      rules: {
        "import/no-unresolved": ["error", { ignore: ["^bun:"] }],
        "node/no-missing-import": "off",
        "unicorn/prefer-module": "off",
      },
      overrides: [
        { files: "*.ts", rules: { "node/no-unsupported-features/es-syntax": ["error", { ignores: ["modules"] }] } },
      ],
    },
  ],
  ignorePatterns: ["node_modules/", "cjs/", "esm/"],
};
