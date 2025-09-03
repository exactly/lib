import js from "@eslint/js";
// @ts-expect-error missing types
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
// @ts-expect-error missing types
import universe from "eslint-config-universe/flat/node.js";
import { flatConfigs as importPlugin } from "eslint-plugin-import";
import node from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import ts from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ts.configs.strictTypeChecked, // eslint-disable-line import/no-named-as-default-member
  ts.configs.stylisticTypeChecked, // eslint-disable-line import/no-named-as-default-member
  comments.recommended, // eslint-disable-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  importPlugin.recommended,
  importPlugin.typescript,
  node.configs["flat/recommended"],
  unicorn.configs.recommended,
  universe, // eslint-disable-line @typescript-eslint/no-unsafe-argument
  {
    languageOptions: { globals: globals.builtin, parserOptions: { project: ["tsconfig.json", "tsconfig.dev.json"] } },
    settings: { "import/resolver": { typescript: true }, jest: { version: "latest" } },
    linterOptions: { reportUnusedDisableDirectives: "error", reportUnusedInlineConfigs: "error" },
    rules: {
      "@eslint-community/eslint-comments/no-unused-disable": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-shadow": "error",
      "import/prefer-default-export": "error",
      "no-console": "warn",
      "no-shadow": "off",
      "unicorn/filename-case": "off",
      "unicorn/number-literal-case": "off",
      "unicorn/prefer-math-min-max": "off",
      "unicorn/switch-case-braces": ["error", "avoid"],
    },
  },
  {
    files: ["test/**"],
    // @ts-expect-error https://github.com/vitest-dev/eslint-plugin-vitest/issues/737
    plugins: { vitest },
    rules: {
      ...vitest.configs.all.rules,
      "vitest/max-expects": "off",
      "vitest/no-hooks": "off",
      "vitest/prefer-expect-assertions": [
        "warn",
        { onlyFunctionsWithExpectInLoop: true, onlyFunctionsWithExpectInCallback: true },
      ],
    },
  },
  { files: ["**/*.cjs"], languageOptions: { globals: globals.commonjs } },
  globalIgnores(["**/dist/", "**/cache/", "**/coverage/", "**/generated/", "**/out/"]),
);
