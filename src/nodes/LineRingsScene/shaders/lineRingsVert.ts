import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, div, divAssign, floor, glPosition, mad, main, mix, mod, mul, sin, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';

export const lineRingsVert = build( () => {
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
    const t = mul( x, TAU / 511.0 );
    const r = mul( mod( mad( floor( mul( 0.5, y ) ), 2.0, time ), 128.0 ), 0.09 );
    const position = def( 'vec4', vec4(
      mul( r, vec2( cos( t ), sin( t ) ) ),
      0.0,
      1.0,
    ) );

    addAssign( sw( position, 'x' ), mix( -2.0, 2.0, mod( y, 2.0 ) ) );

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
