const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

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
