import { PI } from '../../../utils/constants';
import { add, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, main, mix, mul, neg, sw, tan, vec3, vec4 } from '../../../shaders/shaderBuilder';

export const lightShaftVert = build( () => {
  const position = defIn( 'vec3', 0 );

  const vFrustumZ = defOutNamed( 'float', 'vFrustumZ' );
  const vShaftRadius = defOutNamed( 'float', 'vShaftRadius' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );

  const lightFov = defUniformNamed( 'float', 'lightFov' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const lightNearFar = defUniformNamed( 'vec2', 'lightNearFar' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vFrustumZ, add( 0.5, mul( 0.5, sw( position, 'z' ) ) ) );

    const tanFov = def( 'float', tan( mul( lightFov, PI / 360.0 ) ) );
    const near = sw( lightNearFar, 'x' );
    const far = sw( lightNearFar, 'y' );

    assign( vShaftRadius, mix( near, far, vFrustumZ ) );

    const posXYMulTanFov = def( 'vec2', mul( sw( position, 'xy' ), tanFov ) );
    const pos = mix(
      vec3( mul( posXYMulTanFov, near ), neg( near ) ),
      vec3( mul( posXYMulTanFov, far ), neg( far ) ),
      vFrustumZ,
    );

    assign( vPosition, mul( modelMatrix, vec4( pos, 1.0 ) ) );
    const outPos = def( 'vec4', mul( projectionMatrix, viewMatrix, vPosition ) );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
