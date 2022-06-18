import { GLSLExpression, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPointSize, glPosition, main, mul, sin, sw, texture, vec4 } from '../../../shaders/shaderBuilder';
import { PI } from '../../../utils/constants';

export const dustRenderVert = build( () => {
  const computeUV = defIn( 'vec2' );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  // const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );

  main( () => {
    // -- fetch texture ----------------------------------------------------------------------------
    const tex0 = texture( samplerCompute0, computeUV );
    // const tex1 = texture( samplerCompute1, computeUV );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, vec4( sw( tex0, 'xyz' ), 1.0 ) ) );

    const outPos = def( 'vec4', mul(
      projectionMatrix,
      viewMatrix,
      vPosition,
    ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( glPointSize, mul(
      sw( resolution, 'y' ),
      sin( mul( PI, sw( tex0, 'w' ) ) ), // life
      ( ( projectionMatrix ) + '[0][0]' ) as GLSLExpression<'float'>,
      div( 0.001, sw( glPosition, 'w' ) ),
    ) );
  } );
} );
