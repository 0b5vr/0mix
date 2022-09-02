import { add, addAssign, sin, vec3 } from '../../../../shaders/shaderBuilder';
import { assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mul, sw, vec4 } from '../../../../shaders/shaderBuilder';
import { pcg3df } from '../../../../shaders/modules/pcg3df';

export const pillarGridFrameVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const instance = defIn( 'vec2', 1 );

  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vPosition, vec4( position, 1.0 ) );
    const z = mul( 0.2, sin( add(
      mul( 3.0, sw( pcg3df( vec3( instance, 0.0 ) ), 'x' ) ),
      sw( instance, 'x' ),
      sw( instance, 'y' ),
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

    assign( vNormal, vec3( 0.0, 0.0, 1.0 ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
