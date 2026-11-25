import vue from '@vitejs/plugin-vue';
import { copyFileSync, rmSync, statSync } from 'node:fs';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const PAGES = ['index.html', 'chat/index.html'];

rmSync('dist', { recursive: true, force: true });

for (const page of PAGES) {
  await build({
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), viteSingleFile()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'chrome103',
      rollupOptions: { input: page }
    }
  });
  console.log(`dist/${page}  ${(statSync(`dist/${page}`).size / 1024).toFixed(1)} kB`);
}

copyFileSync('dist/chat/index.html', 'dist/chat.html');
console.log('dist/chat.html  (copy, serves /chat without a redirect)');