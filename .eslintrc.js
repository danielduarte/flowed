module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['eslint-plugin', '@typescript-eslint', 'mocha', 'prettier'],
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': [
      'error', {fixToUnknown: false},
    ],
  },
};
