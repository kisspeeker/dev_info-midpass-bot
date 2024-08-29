module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/class-name-casing': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    'no-useless-catch': 'warn',
    '@typescript-eslint/member-naming': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': [
      'error',
      {
        allowDefinitionFiles: true,
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    'brace-style': [
      'error',
      '1tbs',
      {
        allowSingleLine: false,
      },
    ],
    'curly': 'error',
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],
    'eol-last': ['error', 'always'],
    'indent': [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'max-classes-per-file': ['error', 1],
    'newline-after-var': ['error', 'always'],
    'newline-before-return': 'error',
    'no-console': 'off',
    'no-constant-condition': 'off',
    'no-dupe-class-members': 'off',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'object-curly-spacing': ['error', 'always'],
    'operator-linebreak': ['error', 'before'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'space-infix-ops': 'off',
  },
};
