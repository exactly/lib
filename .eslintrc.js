/** @type {import('eslint').Linter.Config} */
module.exports = {
  parserOptions: { project: ['tsconfig.json', 'tsconfig.dev.json'] },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:eslint-comments/recommended',
  ],
  rules: {
    'no-console': 'off',
    'eslint-comments/no-unused-disable': 'error',
  },
  overrides: [
    {
      files: ['**/.eslintrc.js'],
      extends: ['plugin:node/recommended'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
