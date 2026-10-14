module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  rules: {
    'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/semi': ['error'],
    'object-curly-spacing': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single']
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js']
};