import { GLSLExpression, assign, build, defIn, defOutNamed, defUniformNamed, glPointSize, glPosition, main, mix, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const histogramGatherVert = build( () => {
  const u = defIn( 'float' );
  const v = defIn( 'float', 1 );
  const c = defIn( 'float', 2 );

  const vC = defOutNamed( 'float', 'vC' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    // -- fetch texture ----------------------------------------------------------------------------
    const uv = vec2( u, v );
    const tex0 = ( texture( sampler0, uv ) + `[int(${ c })]` ) as GLSLExpression<'float'>;

    // -- render -----------------------------------------------------------------------------------
    assign( vC, c );
    assign( glPosition, vec4( mix( -127.5 / 128.0, 127.5 / 128.0, tex0 ), 0.0, 0.0, 1.0 ) );
    assign( glPointSize, 1.0 );
  } );
} );
