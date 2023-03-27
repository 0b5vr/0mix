import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mix, mixStepChain, mod, mul, mulAssign, sin, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { pcg4df } from '../../../shaders/modules/pcg4df';

export const lineRhombusesVert = build( () => {
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
    const dice = pcg4df( vec4( glslLofi( y, 2.0 ) ) );

    const rhombus = def( 'vec3', mixStepChain(
      x,
      vec3( 0.0, 1.0, 2.0 ),
      [ 1.0, vec3( 0.0, 1.0, -2.0 ) ],
      [ 2.0, vec3( 0.0, -1.0, -2.0 ) ],
      [ 3.0, vec3( 0.0, -1.0, 2.0 ) ],
      [ 4.0, vec3( 0.0, 1.0, 2.0 ) ],
    ) );
    mulAssign( rhombus, mul( 1.0, sw( dice, 'w' ) ) );
    addAssign( rhombus, vec3(
      mix( vec2( -5.0 ), vec2( 5.0 ), sw( dice, 'xy' ) ),
      mad( 3.0, sin( mad( TAU, sw( dice, 'z' ), time ) ), -7.0 ),
    ) );
    mulAssign( sw( rhombus, 'x' ), mix( -1.0, 1.0, mod( y, 2.0 ) ) );

    const position = def( 'vec4', vec4(
      rhombus,
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
