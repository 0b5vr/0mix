import { assign, build, defInNamed, defOutNamed, fract, insert, main, pow, vec4 } from '../shaderBuilder';

export const uvFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  main( () => {
    assign( fragColor, pow( fract( vec4( vUv, 0.5, 1.0 ) ), vec4( 2.2 ) ) );
  } );
} );
