'use strict';

const path = require('path');
const fs = require('fs');

if (isDir(path.join(__dirname, 'dist'))) {
  module.exports = require('./dist');
} else {
  module.exports = require('./src');
}

function isDir(pathToDir) {
  try {
    return fs.statSync(pathToDir).isDirectory();
  } catch (e) {
    return false;
  }
}
