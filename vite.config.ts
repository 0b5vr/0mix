import { defineConfig, Terser } from 'vite';
import { domprops } from './domprops';
import { automatonMinifierPlugin } from './vite-automaton-minifier-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

const terserOptions: Terser.MinifyOptions = {
  compress: {
    arguments: true,
    booleans_as_integers: true,
    drop_console: true,
    keep_fargs: false,
    passes: 2,
    unsafe_arrows: true,
    unsafe_math: true,
    unsafe_symbols: true,
  },
  mangle: {
    properties: {
      builtins: true,
      regex: /.+/,
      keep_quoted: true,
      reserved: [
        // material tags
        'forward',
        'deferred',
        'depth',

        // dom props
        ...domprops,
      ],
    },
  },
  format: {
    ascii_only: true,
    comments: false,
  },
  module: true,
  toplevel: true,
};

export default defineConfig( ( { mode } ) => {
  return {
    build: {
      target: 'esnext',
      minify: mode === 'prod' ? 'terser' : false,
      terserOptions: mode === 'prod' ? terserOptions : undefined,
      sourcemap: true,
      rollupOptions: {
        plugins: [
          visualizer( {
            json: true,
            gzipSize: true,
            brotliSize: true,
          } ),
        ],
      }
    },
    plugins: [
      automatonMinifierPlugin( {
        minify: mode === 'prod',
        minimizeOptions: {
          precisionTime: 3,
          precisionValue: 3,
        },
      } ),
    ]
  };
} );
