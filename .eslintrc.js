module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/class-name-casing": "off",
        "@typescript-eslint/member-naming": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-namespace": [
          "error",
          {
            allowDefinitionFiles: true,
          },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-var-requires": "off",
        "no-undef": "off",
        "space-infix-ops": "off",
        "function-paren-newline": ["error", "consistent"],
        "arrow-parens": ["error", "as-needed", { "requireForBlockBody": true }],
        "brace-style": [
          "error",
          "1tbs",
          {
            allowSingleLine: false,
          },
        ],
      },
    },
  ],
};
