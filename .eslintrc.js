module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    browser: true,
  },
  extends: ['xo-space', 'xo-react/space', 'xo-typescript'],
  rules: {
    '@typescript-eslint/object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/indent': ['error', 2, { SwitchCase: 1 }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    'capitalized-comments': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'react/jsx-tag-spacing': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'no-warning-comments': 'off',
    complexity: 'off',
    'jsx-quotes': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-unnecessary-type-arguments': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/indent': 'off',
    'operator-linebreak': 'off',
    'react/no-unknown-property': ['error', { ignore: ['css'] }],
    'react/prefer-read-only-props': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        extendDefaults: false,
        types: {
          String: {
            message: 'Use `string` instead.',
            fixWith: 'string',
          },
          Number: {
            message: 'Use `number` instead.',
            fixWith: 'number',
          },
          Boolean: {
            message: 'Use `boolean` instead.',
            fixWith: 'boolean',
          },
          Symbol: {
            message: 'Use `symbol` instead.',
            fixWith: 'symbol',
          },
          Object: {
            message:
              'The `Object` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead. See https://github.com/typescript-eslint/typescript-eslint/pull/848',
            fixWith: 'Record<string, unknown>',
          },
          '{}': {
            message:
              'The `{}` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead.',
            fixWith: 'Record<string, unknown>',
          },
          object: {
            message:
              'The `object` type is hard to use. Use `Record<string, unknown>` instead. See: https://github.com/typescript-eslint/typescript-eslint/pull/848',
            fixWith: 'Record<string, unknown>',
          },
          Function: 'Use a specific function type instead, like `() => void`.',
          '[]': "Don't use the empty array type `[]`. It only allows empty arrays. Use `SomeType[]` instead.",
          '[[]]':
            "Don't use `[[]]`. It only allows an array with a single element which is an empty array. Use `SomeType[][]` instead.",
          '[[[]]]': "Don't use `[[[]]]`. Use `SomeType[][][]` instead.",
        },
      },
    ],
  },
};
