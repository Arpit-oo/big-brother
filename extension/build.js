const esbuild = require('esbuild');

async function build() {
  // Background service worker
  await esbuild.build({
    entryPoints: ['extension/background.ts'],
    outfile: 'extension/dist/background.js',
    bundle: true,
    format: 'esm',
    target: 'chrome120',
  });

  // Content script
  await esbuild.build({
    entryPoints: ['extension/content.ts'],
    outfile: 'extension/dist/content.js',
    bundle: true,
    format: 'iife',
    target: 'chrome120',
  });

  // Copy manifest
  const fs = require('fs');
  fs.copyFileSync('extension/manifest.json', 'extension/dist/manifest.json');

  console.log('Extension built to extension/dist/');
}

build();
