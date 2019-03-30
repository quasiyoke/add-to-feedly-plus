module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb-base',
  ],
  env: {
    webextensions: true,
  },
  rules: {
    'function-paren-newline': ['error', 'consistent'],
    'import/prefer-default-export': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-unused-vars': ['error', {
      'argsIgnorePattern': 'unused',
      'varsIgnorePattern': 'unused',
    }],
    'prefer-promise-reject-errors': 'off',
  },
};
