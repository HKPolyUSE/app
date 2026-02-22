import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(__dirname, 'src');   // ← scan jsx files here
const rootDir = path.resolve(__dirname);          // ← html files are here

const entries = {};
fs.readdirSync(srcDir)
  .filter(f => f.endsWith('.jsx'))
  .forEach(f => {
    const name = path.basename(f, '.jsx');
    entries[name] = resolve(rootDir, `${name}.html`);  // ← root, not src
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
