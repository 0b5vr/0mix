import { addAssign, assign, build, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mul, mulAssign, sw, vec4 } from '../../../shaders/shaderBuilder';

export const sphereArrayVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const instance = defIn( 'vec2', 3 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vInstance = defOutNamed( 'vec2', 'vInstance' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );

    mulAssign( sw( vPositionWithoutModel, 'xyz' ), 0.1 );

    addAssign( sw( vPositionWithoutModel, 'xy' ), instance );

    assign( glPosition, mul( projectionMatrix, viewMatrix, modelMatrix, vPositionWithoutModel ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( glPosition, 'x' ), aspect );

    assign( vInstance, instance );
  } );
} );
