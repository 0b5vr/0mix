import { TAU } from '../../../utils/constants';
import { add, addAssign, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mul, mulAssign, sin, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { perlin3d } from '../../../shaders/modules/perlin3d';

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
    const r = mad( -0.005, y, 1.0 );

    const ring = def( 'vec3', vec3(
      mul( r, vec2( cos( t ), sin( t ) ) ),
      mad( -0.1, y, 0.0 ),
    ) );

    const noiseUv = def( 'vec3', ring );
    mulAssign( noiseUv, vec3( 2.0, 2.0, 0.1 ) );
    addAssign( sw( noiseUv, 'z' ), mul( 0.4, time ) );

    addAssign( sw( ring, 'x' ), mul( 0.03, r, y, perlin3d( noiseUv ) ) );
    addAssign( sw( ring, 'y' ), mul( 0.03, r, y, perlin3d( add( 4.0, noiseUv ) ) ) );

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
