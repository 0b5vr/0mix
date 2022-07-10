import { assign, build, defInNamed, defOut, eq, insert, main, tern, vec4 } from '../../../shaders/shaderBuilder';

export const histogramGatherFrag = build( () => {
  insert( 'precision highp float;' );

  const vC = defInNamed( 'float', 'vC' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    assign( fragColor, vec4(
      tern( eq( vC, 0.0 ), 1.0, 0.0 ),
      tern( eq( vC, 1.0 ), 1.0, 0.0 ),
      tern( eq( vC, 2.0 ), 1.0, 0.0 ),
      1.0,
    ) );
  } );
} );
