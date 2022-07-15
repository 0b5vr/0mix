import { pcg3df } from '../../../../shaders/modules/pcg3df';
import { add, addAssign, mad, sin, vec3 } from '../../../../shaders/shaderBuilder';
import { assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mul, normalize, sw, vec4 } from '../../../../shaders/shaderBuilder';

export const pillarGridVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const instance = defIn( 'vec2', 3 );

  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vNoiseCoord = defOutNamed( 'vec3', 'vNoiseCoord' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  main( () => {
    assign( vPosition, vec4( position, 1.0 ) );
    const z = mul( 0.2, sin( add(
      mul( 3.0, sw( pcg3df(
        mad( 64.0, vec3( instance, 0.0 ), 16.0 ),
      ), 'x' ) ),
      sw( instance, 'x' ),
      time,
    ) ) );
    addAssign( vPosition, vec4(
      instance,
      z,
      0.0,
    ) );
    assign( vPosition, mul( modelMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign(
      vNormal,
      normalize( mul( normalMatrix, normal ) ),
    );

    assign( vNoiseCoord, mul( add(
      1024.0,
      sw( vec4( position, 1.0 ), 'xyz' ),
      vec3( instance, 0.0 ),
    ), 4.0 ) );
  } );
} );
