import { add, addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mul, mulAssign, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { orthBas } from '../../../shaders/modules/orthBas';
import { perlin3d } from '../../../shaders/modules/perlin3d';

export const lineWaveVert = build( () => {
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
    const position = def( 'vec4', vec4(
      mad( 1.0 / 128.0, vec2( x, y ), -2.0 ),
      0.0,
      1.0,
    ) );

    // -- apply noise ------------------------------------------------------------------------------
    const t = def( 'float', mul( 0.4, time ) );
    const noisePxy = def( 'vec3', mul(
      5.0,
      sw( position, 'xyz' ),
      orthBas( vec3( -1.0, -2.0, 3.0 ) ),
    ) );
    const noise = def( 'vec3', add(
      mul( 0.1, vec3(
        perlin3d( add( noisePxy, 0.0, t ) ),
        perlin3d( add( noisePxy, 1.0, t ) ),
        perlin3d( add( noisePxy, 2.0, t ) ),
      ) ),
    ) );

    mulAssign( t, 2.0 );
    mulAssign( noisePxy, mul(
      4.0,
      orthBas( vec3( -3.0, -5.0, -1.0 ) ),
    ) );
    addAssign( noise, add(
      mul( 0.01, vec3(
        perlin3d( add( noisePxy, 0.0, t ) ),
        perlin3d( add( noisePxy, 1.0, t ) ),
        perlin3d( add( noisePxy, 2.0, t ) ),
      ) ),
    ) );

    addAssign( sw( position, 'xyz' ), noise );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
