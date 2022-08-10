import { TAU } from '../../../utils/constants';
import { add, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mod, mul, sin, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';

export const lineTriTunnelVert = build( () => {
  const x = defIn( 'float', 0 );
  const y = defIn( 'float', 1 );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    // -- create local position --------------------------------------------------------------------
    const t = add( mul( -0.1, y ), mul( TAU / 3.0, x ), mul( 0.1, time ) );
    const position = def( 'vec4', vec4(
      vec2( cos( t ), sin( t ) ),
      add( -25.0, mul( 0.3, mod( add( y, mul( 2.0, time ) ), 512.0 ) ) ),
      1.0,
    ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    // -- haha -------------------------------------------------------------------------------------
    assign( vNormal, vec3( 0.0, 0.0, 1.0 ) );
  } );
} );
