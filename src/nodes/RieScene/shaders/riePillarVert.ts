import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mod, mul, mulAssign, normalize, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const riePillarVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const instance = defIn( 'float', 2 );

  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vInstance = defOutNamed( 'vec3', 'vInstance' );
  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );
    assign( vNormal, normal );

    assign( vInstance, vec3(
      instance,
      sub( mod( mad( time, 0.2, instance ), 40.0 ), 30.0 ), // position z
      mul( TAU * 103.0 / 200.0, instance ), // rotation xy
    ) );
    addAssign( sw( vPositionWithoutModel, 'y' ), 0.5 );
    addAssign( sw( vPositionWithoutModel, 'z' ), sw( vInstance, 'y' ) );

    const rot = def( 'mat2', rotate2D( sw( vInstance, 'z' ) ) );
    mulAssign( sw( vPositionWithoutModel, 'xy' ), rot );
    mulAssign( sw( vNormal, 'xy' ), rot );

    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( vNormal, normalize( mul( normalMatrix, vNormal ) ) );
  } );
} );
