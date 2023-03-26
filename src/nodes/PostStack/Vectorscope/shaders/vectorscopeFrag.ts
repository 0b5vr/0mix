import { assign, build, defOut, glPointCoord, insert, length, main, smoothstep, sub, vec4 } from '../../../../shaders/shaderBuilder';

export const vectorscopeFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    assign( fragColor, vec4( smoothstep( 0.5, 0.0, length( sub( 0.5, glPointCoord ) ) ) ) );
    return;
  } );
} );
