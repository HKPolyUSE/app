const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const rootDir = path.resolve(__dirname);  // ← write HTML to root
const repoName = 'app';
const orgName = 'hkpolyuse';

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const name = path.basename(file, '.jsx');
  const html = `<!DOCTYPE html>
<html>
  <head><title>${name}</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/${file}"></script>
  </body>
</html>`;
  fs.writeFileSync(path.resolve(rootDir, `${name}.html`), html);  // ← root
  console.log(`Generated ${name}.html`);
});

// Generate README
const links = files.map(file => {
  const name = path.basename(file, '.jsx');
  return `- [${name}](https://${orgName}.github.io/${repoName}/${name}.html)`;
}).join('\n');

const readme = `# App Components\n\n## Live Pages\n\n${links}\n`;
fs.writeFileSync(path.resolve(rootDir, 'README.md'), readme);
console.log('Generated README.md');
