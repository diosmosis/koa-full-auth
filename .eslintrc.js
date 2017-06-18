module.exports = {
  extends: 'airbnb-base',
  plugins: [
    'babel',
  ],
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: false,
  },
  rules: {
    'strict': 0,
    'max-len': ['error', 120],
    'no-use-before-define': ['error', { 'functions': false, 'classes': true }],
  },
  env: {
    node: true,
  },
};
