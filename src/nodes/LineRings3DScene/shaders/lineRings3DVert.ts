import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, div, divAssign, floor, glPosition, mad, main, mod, mul, mulAssign, sin, subAssign, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { rotate2D } from '../../../shaders/modules/rotate2D';

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
    const p = def( 'vec2', vec2(
      mod( y, 30.0 ),
      floor( div( y, 30.0 ) ),
    ) );
    subAssign( p, vec2( 14.5, 4.5 ) );
    mulAssign( p, 0.3 );

    const n = def( 'vec3', cyclicNoise( vec3( p, mul( 0.5, time ) ), { freq: 1.2 } ) );

    const t = mul( x, TAU / 255.0 );
    const r = mad( 0.05, sw( n, 'z' ), 0.1 );
    const ring = def( 'vec3', vec3( mul( r, vec2( cos( t ), sin( t ) ) ), 0.0 ) );
    mulAssign( sw( ring, 'zx' ), rotate2D( mul( TAU, sw( n, 'y' ) ) ) );
    mulAssign( sw( ring, 'yz' ), rotate2D( mul( TAU, sw( n, 'x' ) ) ) );

    addAssign( ring, vec3( p, -5.0 ) );

    const position = def( 'vec4', vec4(
      ring,
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
