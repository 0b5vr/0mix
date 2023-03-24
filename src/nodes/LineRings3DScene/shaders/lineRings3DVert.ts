import { TAU } from '../../../utils/constants';
import { assign, build, cos, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mul, sin, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const lineRings3DVert = build( () => {
  const x = defIn( 'float', 0 );
  const y = defIn( 'float', 1 );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    // -- create local position --------------------------------------------------------------------
    const t = mul( x, TAU / 255.0 );
    const r = mad( 0.1, sin( mad( 1.0, y, time ) ), 0.5 );
    const position = def( 'vec4', vec4(
      mul( r, vec2( cos( t ), sin( t ) ) ),
      mul( -0.1, y ),
      1.0,
    ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
