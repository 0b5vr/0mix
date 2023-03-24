import { TAU } from '../../../utils/constants';
import { add, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, main, mod, mul, neg, sin, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const lineTriTunnelVert = build( () => {
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
    const t = add( mul( -TAU / 50.0, y ), mul( TAU / 3.0, x ), mul( 0.1, time ) );
    const position = def( 'vec4', vec4(
      vec2( cos( t ), sin( t ) ),
      neg( mod( add( mul( -0.3, y ), mul( -0.6, time ) ), 15.0 ) ),
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
