import { assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, floor, glPosition, mad, main, mixStepChain, mod, mul, mulAssign, subAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const wireCubeVert = build( () => {
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
    const a = mod( y, 2.0 );
    const b = mod( floor( div( y, 2.0 ) ), 2.0 );
    const c = mod( x, 2.0 );

    const i = floor( div( y, 12.0 ) );
    const phase = mod( mad( 1.0, time, i ), 20.0 );

    const basis = mixStepChain(
      mod( y, 12.0 ),
      vec3( a, b, c ),
      [ 4.0, vec3( b, c, a ) ],
      [ 8.0, vec3( c, a, b ) ],
    );

    const position = def( 'vec4', vec4(
      mad( 2.0, basis, -1.0 ),
      1.0,
    ) );
    mulAssign( sw( position, 'xyz' ), mul( 0.1, phase ) );
    mulAssign( sw( position, 'zx' ), rotate2D( mad( -0.05, phase, mul( 0.5, time ) ) ) );
    mulAssign( sw( position, 'yz' ), rotate2D( mad( -0.02, phase, mul( 0.2, time ) ) ) );
    subAssign( sw( position, 'z' ), 5.0 );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
