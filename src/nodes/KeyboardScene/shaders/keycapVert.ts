import { addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mul, mulAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';

export const keycapVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const instance = defIn( 'vec4', 2 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vOffset = defOutNamed( 'vec3', 'vOffset' );
  const vInstance = defOutNamed( 'vec4', 'vInstance' );

  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vProjPosition, vec4( position, 1.0 ) );
    mulAssign( sw( vProjPosition, 'x' ), sw( instance, 'z' ) );
    assign( vOffset, vec3(
      mad( sw( instance, 'z' ), 2.0, sw( instance, 'x' ) ),
      0.0,
      mad( 1.0, 2.0, sw( instance, 'y' ) ),
    ) );
    addAssign( sw( vProjPosition, 'xyz' ), vOffset );
    assign( vPositionWithoutModel, vProjPosition );

    assign( vProjPosition, mul(
      projectionMatrix,
      viewMatrix,
      modelMatrix,
      vProjPosition,
    ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( vInstance, instance );
  } );
} );
