const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const rootDir = path.resolve(__dirname);
const repoName = 'app';
const orgName = 'hkpolyuse';

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const name = path.basename(file, '.jsx');
  const filePath = path.resolve(srcDir, file);

  // 1. Read original JSX content
  let content = fs.readFileSync(filePath, 'utf8');

  // 2. Add ReactDOM import at top if not already present
  if (!content.includes('react-dom/client')) {
    content = `import ReactDOM from 'react-dom/client';\n` + content;
  }

  // 3. Add render call at bottom if not already present
  if (!content.includes('ReactDOM.createRoot')) {
    const componentName = name.charAt(0).toUpperCase() + name.slice(1);
    content += `\nReactDOM.createRoot(document.getElementById('root')).render(<${componentName} />);\n`;
  }

  // 4. Write patched JSX to ROOT (not src/)
  const patchedFile = `${name}.patched.jsx`;
  fs.writeFileSync(path.resolve(rootDir, patchedFile), content);  // ← rootDir here

  // 5. Generate HTML pointing to root-level patched file
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
  console.log(`Generated ${name}.html → ${patchedFile} (root)`);
});

// Generate README
const links = files.map(file => {
  const name = path.basename(file, '.jsx');
  return `- [${name}](https://${orgName}.github.io/${repoName}/${name}.html)`;
}).join('\n');

fs.writeFileSync(path.resolve(rootDir, 'README.md'), `# App Components\n\n## Live Pages\n\n${links}\n`);
console.log('Generated README.md');
