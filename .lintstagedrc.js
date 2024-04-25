const path = require('path');

const getRelativePaths = files => {
  return files.map(file => path.relative(process.cwd(), file));
}

module.exports = {
  '{services,packages,tools}/**/*.{ts,tsx}': files => {
    return `nx affected --target=typecheck --files=${getRelativePaths(files).join(',')}`;
  },
  '{services,packages,tools}/**/*.{js,ts,jsx,tsx,json}': [
    files => `nx affected -t lint`,
    files => `nx format -t write`,
  ],
  };
