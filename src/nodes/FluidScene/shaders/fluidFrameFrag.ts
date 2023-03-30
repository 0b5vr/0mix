import { assign, build, defOutNamed, insert, main, vec4 } from '../../../shaders/shaderBuilder';

export const fluidFrameFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  main( () => {
    assign( fragColor, vec4( 1.0 ) );
  } );
} );
