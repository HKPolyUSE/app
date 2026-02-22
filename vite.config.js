import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(__dirname, 'src');
const rootDir = path.resolve(__dirname);
const entries = {};

fs.readdirSync(srcDir)
  .filter(f => f.endsWith('.jsx') && !f.endsWith('.patched.jsx'))
  .forEach(f => {
    const name = path.basename(f, '.jsx');
    entries[name] = resolve(rootDir, `${name}.html`);
  });

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    rollupOptions: {
      input: entries,
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  }
});
