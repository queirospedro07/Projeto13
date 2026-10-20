const path = require('node:path');

function getDataDirectory() {
  const root = path.resolve(__dirname, '../..');

  return path.resolve(root, process.env.DATA_DIRECTORY || 'data');
}

exports.getDataDirectory = getDataDirectory;
