import { GLSLExpression, assign, build, defIn, defUniformNamed, glPosition, main, texture, vec4, vec2, mix, defOutNamed, tern, eq, div } from '../../../shaders/shaderBuilder';

export const histogramPlotVert = build( () => {
  const y = defIn( 'float' );
  const u = defIn( 'float', 1 );
  const c = defIn( 'float', 2 );

  const vC = defOutNamed( 'float', 'vC' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    // -- fetch texture ----------------------------------------------------------------------------
    const uv = vec2( u, 0.5 );
    const tex0 = ( texture( sampler0, uv ) + `[int(${ c })]` ) as GLSLExpression<'float'>;

    // -- geometry ---------------------------------------------------------------------------------
    const yt = tern(
      eq( y, 0.0 ),
      -1.0,
      mix( -1.0, 1.0, div( tex0, 4096.0 ) ),
    );

    // -- render -----------------------------------------------------------------------------------
    assign( vC, c );
    assign( glPosition, vec4( mix( -1.0, 1.0, u ), yt, 0.0, 1.0 ) );
  } );
} );
