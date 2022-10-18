import { TAU } from '../../../utils/constants';
import { assign, build, cos, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, mad, main, mul, mulAssign, sin, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const fluidRingsVert = build( () => {
  const x = defIn( 'float', 0 );
  const y = defIn( 'float', 1 );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    // -- create local position --------------------------------------------------------------------
    const t = mul( x, TAU / 511.0 );
    const r = mad( 0.6, 0.02, y );
    const position = def( 'vec4', vec4(
      mul( r, vec2( cos( t ), sin( t ) ) ),
      0.0,
      1.0,
    ) );

    mulAssign( sw( position, 'yz' ), rotate2D( mad( 1.4, -0.05, y ) ) );
    mulAssign( sw( position, 'zx' ), rotate2D( mul( 0.4, time ) ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
