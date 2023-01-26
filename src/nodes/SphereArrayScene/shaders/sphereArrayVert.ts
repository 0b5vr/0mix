import { addAssign, assign, build, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, main, mul, mulAssign, sw, vec4 } from '../../../shaders/shaderBuilder';

export const sphereArrayVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const instance = defIn( 'vec2', 3 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vInstance = defOutNamed( 'vec2', 'vInstance' );

  const aspect = defUniformNamed( 'float', 'aspect' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );

    mulAssign( sw( vPositionWithoutModel, 'xyz' ), 0.1 );

    addAssign( sw( vPositionWithoutModel, 'xy' ), instance );

    assign( vProjPosition, mul( pvm, vPositionWithoutModel ) );
    assign( glPosition, vProjPosition );

    divAssign( sw( glPosition, 'x' ), aspect );

    assign( vInstance, instance );
  } );
} );
