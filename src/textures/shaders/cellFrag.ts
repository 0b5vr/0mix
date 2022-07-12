import { assign, build, def, defInNamed, defOut, div, insert, main, mul, vec2, vec4 } from '../../shaders/shaderBuilder';
import { voronoi2d } from '../../shaders/modules/voronoi2d';
import { voronoi2dBorder } from '../../shaders/modules/voronoi2dBorder';

export const cellFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const p = def( 'vec2', mul( vUv, 32.0 ) );

    const voronoi = voronoi2d( p, vec2( 32.0 ) );
    const border = voronoi2dBorder( voronoi, p, vec2( 32.0 ) );

    assign( fragColor, vec4( div( mul( border ), 32.0 ), 1.0 ) );
  } );
} );
