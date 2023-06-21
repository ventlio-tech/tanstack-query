import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import type { RollupOptions } from 'rollup';
import typescript from 'rollup-plugin-typescript2';

const config: RollupOptions = {
  input: 'src/index.ts',
  output: [
    {
      dir: './dist',
      entryFileNames: '[name].mjs',
      format: 'esm',
      banner: '',
      sourcemap: true,
    },
    {
      dir: './dist',
      entryFileNames: '[name].js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      banner: '',
    },
  ],
  plugins: [resolve(), typescript({ rollupCommonJSResolveHack: false, clean: true }), commonjs(), json()],
  external: ['react', 'lodash.result', 'lodash.set', 'react-dom', 'axios', '@tanstack/react-query'],
};

export default config;
