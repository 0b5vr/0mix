import { add, addAssign, assign, build, def, defIn, defUniformNamed, div, divAssign, floor, glPointSize, glPosition, main, mat2, mul, mulAssign, subAssign, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';

export const vectorscopeVert = build( () => {
  const index = defIn( 'float', 0 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const samplerL = defUniformNamed( 'sampler2D', 'samplerL' );
  const samplerR = defUniformNamed( 'sampler2D', 'samplerR' );

  // const sinc = ( x: GLSLFloatExpression ): GLSLExpression<'float'> => (
  //   tern( eq( x, 0.0 ), 1.0, div( sin( mul( PI, x ) ), PI, x ) )
  // );

  main( () => {
    const position = def( 'vec2', vec2( 0.0 ) );

    const i0 = floor( add( index, 0.5 ) );

    const uv = vec2( div( i0, 1024 ), 0.5 );
    addAssign( position, vec2(
      sw( texture( samplerL, uv ), 'x' ),
      sw( texture( samplerR, uv ), 'x' ),
    ) );

    mulAssign( position, mat2( -0.5, 0.5, 0.5, 0.5 ) );

    const scale = floor( div( sw( resolution, 'y' ), 360.0 ) );

    mulAssign( position, mul( 40.0, scale ) );
    addAssign( position, resolution );
    subAssign( position, mul( vec2( 14.0 * 6.0, 13.0 * 7.0 ), scale ) );
    divAssign( position, resolution );

    assign( glPosition, vec4( position, 0.0, 1.0 ) );
    assign( glPointSize, 2.0 );
  } );
} );
