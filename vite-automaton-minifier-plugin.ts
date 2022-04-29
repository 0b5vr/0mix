import { AutomatonWithGUI, MinimizeOptions } from '@0b5vr/automaton-with-gui';
import { Plugin } from 'vite';

const fileRegex = /automaton\.json$/;

export interface AutomatonMinifierPluginOptions {
  /**
   * True by default
   */
  minify: boolean;

  minimizeOptions: MinimizeOptions;
}

export const automatonMinifierPlugin: (
  options: AutomatonMinifierPluginOptions
) => Plugin = ( { minify, minimizeOptions } ) => {
  return {
    name: 'automaton-minifier',
    enforce: 'pre',
    transform( src: string, id: string ) {
      if ( !minify ) {
        return null;
      }

      if ( fileRegex.test( id ) ) {
        const data = JSON.parse( src );
        const minified = AutomatonWithGUI.minimizeData( data, minimizeOptions );

        return {
          code: JSON.stringify( minified ),
        };
      }
    }
  }
}
