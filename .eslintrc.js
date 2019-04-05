module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb-base',
    'plugin:flowtype/recommended',
  ],
  env: {
    webextensions: true,
  },
  plugins: [
    'flowtype',
  ],
  rules: {
    'flowtype/no-types-missing-file-annotation': 'off',
    'function-paren-newline': ['error', 'consistent'],
    'import/prefer-default-export': 'off',
    'max-len': ['error', 200],
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-unused-vars': ['error', {
      'argsIgnorePattern': 'unused',
      'varsIgnorePattern': 'unused',
    }],
    'prefer-promise-reject-errors': 'off',
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: false,
    },
  },
};
