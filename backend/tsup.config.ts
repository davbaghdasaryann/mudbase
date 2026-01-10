import {defineConfig} from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    tsconfig: 'tsconfig.json',
    // format: ['esm', 'cjs'], // Supports both ESM & CommonJS
    format: ['esm'], // Supports both ESM & CommonJS
    target: 'node20',
    outDir: 'build',
    splitting: false, // Single output file per format
    sourcemap: false,
    clean: true,
    dts: true, // Generates type definitions
    minify: true,
    bundle: true, // Bundles all dependencies
    shims: true, // Polyfills for Node.js features
    //external: [], // ✅ Force tsup to bundle EVERYTHING, no external modules
    // noExternal: [/./], // ✅ Bundle all `node_modules` packages
});
