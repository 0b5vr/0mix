import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mod, mul, mulAssign, normalize, sub, sw, vec4 } from '../../../shaders/shaderBuilder';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const riePillarVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const instance = defIn( 'float', 2 );

  const vNoiseCoord = defOutNamed( 'vec3', 'vNoiseCoord' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  main( () => {
    assign( vNoiseCoord, position );
    addAssign( vNoiseCoord, instance );

    assign( vPosition, vec4( position, 1.0 ) );
    assign( vNormal, normal );

    addAssign( sw( vPosition, 'y' ), 1.0 );
    addAssign( sw( vPosition, 'z' ), sub( mod( mad( time, 0.2, instance ), 40.0 ), 30.0 ) );

    const rot = rotate2D( mul( TAU * 51.0 / 200.0, instance ) );
    mulAssign( sw( vPosition, 'xy' ), rot );
    mulAssign( sw( vNormal, 'xy' ), rot );

    assign( vPosition, mul( modelMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( vNormal, normalize( mul( normalMatrix, vNormal ) ) );
  } );
} );
