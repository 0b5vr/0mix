import { assign, build, defOutNamed, defUniformNamed, insert, main } from '../shaderBuilder';

export const colorFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );
  const color = defUniformNamed( 'vec4', 'color' );

  main( () => {
    assign( fragColor, color );
  } );
} );
