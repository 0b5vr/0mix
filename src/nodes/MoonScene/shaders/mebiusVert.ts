import { TAU } from '../../../utils/constants';
import { addAssign, assign, build, cos, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mul, mulAssign, sin, sw, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const mebiusVert = build( () => {
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
    const yt = mul( 0.02, mad( 1.0, y, -6.0 ) );
    const phase = mul( TAU / 256.0, x );

    const r = mad( yt, cos( phase ), 1.4 );
    const position = def( 'vec4', vec4(
      mul( cos( phase ), r ),
      mul( yt, sin( mul( 0.5, phase ) ) ),
      mul( sin( phase ), r ),
      1.0,
    ) );

    addAssign( sw( position, 'xyz' ), mul(
      0.2,
      cyclicNoise( mad( 0.1, time, sw( position, 'xyz' ) ), { warp: 0.5, freq: 1.2 } ),
    ) );
    mulAssign( sw( position, 'zx' ), rotate2D( mul( 0.4, time ) ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
