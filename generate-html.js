const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const repoName = 'app';
const orgName = 'hkpolyuse';
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

// Generate HTML files
files.forEach(file => {
  const name = path.basename(file, '.jsx');
  const html = `<!DOCTYPE html>
<html>
  <head><title>${name}</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${file}"></script>
  </body>
</html>`;
  fs.writeFileSync(path.resolve(srcDir, `${name}.html`), html);
  console.log(`Generated ${name}.html`);
});

// Generate README.md with all public links
const links = files.map(file => {
  const name = path.basename(file, '.jsx');
  return `- [${name}](https://${orgName}.github.io/${repoName}/${name}.html)`;
}).join('\n');

const readme = `# App Components

## Live Pages

${links}
`;

fs.writeFileSync(path.resolve(__dirname, 'README.md'), readme);
console.log('Generated README.md');
