const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const rootDir = path.resolve(__dirname);
const repoName = 'app';
const orgName = 'hkpolyuse';

function getComponentName(content, fallback) {
  let match = content.match(/export\s+default\s+function\s+(\w+)/);
  if (match) return match[1];

  match = content.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
  if (match) return match[1];

  match = content.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|React\.memo)/);
  if (match) return match[1];

  return fallback;
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const name = path.basename(file, '.jsx');
  const filePath = path.resolve(srcDir, file);

  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('react-dom/client')) {
    content = `import ReactDOM from 'react-dom/client';\n` + content;
  }

  const componentName = getComponentName(content, name.charAt(0).toUpperCase() + name.slice(1));

  if (!content.includes('ReactDOM.createRoot')) {
    content += `\nReactDOM.createRoot(document.getElementById('root')).render(<${componentName} />);\n`;
  }

  const patchedFile = `${name}.patched.jsx`;
  fs.writeFileSync(path.resolve(rootDir, patchedFile), content);

  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${patchedFile}"></script>
  </body>
</html>`;

  fs.writeFileSync(path.resolve(rootDir, `${name}.html`), html);
  console.log(`Generated ${name}.html → renders <${componentName} />`);
});

const links = files.map(file => {
  const name = path.basename(file, '.jsx');
  return `- [${name}](https://${orgName}.github.io/${repoName}/${name}.html)`;
}).join('\n');

fs.writeFileSync(path.resolve(rootDir, 'README.md'), `# App Components\n\n## Live Pages\n\n${links}\n`);
console.log('Generated README.md');
