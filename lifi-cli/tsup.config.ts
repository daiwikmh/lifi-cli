import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    outDir: 'dist',
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entry: { 'mcp/server': 'src/mcp/server.ts' },
    format: ['esm'],
    outDir: 'dist',
    sourcemap: true,
  },
])
