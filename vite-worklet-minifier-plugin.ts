import * as Terser from 'terser';
import { Plugin } from 'vite';

const fileRegex = /\?worklet$/;

export interface WorkletMinifierPluginOptions {
  minify: boolean;
  minifyOptions: Terser.MinifyOptions;
}

export const workletMinifierPlugin: (
  options: WorkletMinifierPluginOptions
) => Plugin = ( { minify, minifyOptions } ) => {
  return {
    name: 'worklet-minifier',
    enforce: 'pre',
    async transform( src: string, id: string ) {
      if ( fileRegex.test( id ) ) {
        if ( !minify ) {
          return `export default \`${ src }\`;`;
        }

        // AudioWorkletProcessor.process have to return `true` or `false`,
        // which does not accept `0` or `1`.
        // `options.compress.booleans_as_integers` have to be disabled
        const newMinifyOptions = JSON.parse( JSON.stringify( minifyOptions ) );
        newMinifyOptions.compress.booleans_as_integers = false;

        const result = await Terser.minify( src, newMinifyOptions );

        return {
          code: `export default '${ result.code }';`,
        };
      }
    }
  };
};
