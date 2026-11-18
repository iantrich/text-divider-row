import { readFileSync } from 'node:fs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  input: 'src/text-divider-row.ts',
  output: {
    file: 'dist/text-divider-row.js',
    format: 'es',
  },
  plugins: [
    resolve(),
    typescript(),
    replace({
      preventAssignment: true,
      values: { __CARD_VERSION__: JSON.stringify(pkg.version) },
    }),
    terser({ format: { comments: false } }),
  ],
};
