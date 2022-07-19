import { defineConfig } from 'vite';
import { automatonMinifierPlugin } from './vite-automaton-minifier-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import { workletMinifierPlugin } from './vite-worklet-minifier-plugin';
import { terserMinifyOptions } from './terserMinifyOptions';
import Inspect from 'vite-plugin-inspect';

export default defineConfig( ( { mode } ) => {
  return {
    resolve: {
      alias: {
        ...( mode === 'prod' ? {
          'webgl-memory': `${ __dirname }/src/dummy.ts`, // don't want to import webgl-memory when it's prod build
        } : {} ),
      },
    },
    build: {
      target: 'esnext',
      minify: mode === 'prod' ? 'terser' : false,
      terserOptions: mode === 'prod' ? terserMinifyOptions : undefined,
      sourcemap: true,
      polyfillModulePreload: false, // size
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
      Inspect(),
      automatonMinifierPlugin( {
        minify: mode === 'prod',
        minimizeOptions: {
          precisionTime: 3,
          precisionValue: 3,
        },
      } ),
      workletMinifierPlugin( {
        minify: mode === 'prod',
        minifyOptions: terserMinifyOptions,
      } ),
    ]
  };
} );
