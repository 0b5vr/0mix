import { MTL_PBR_ROUGHNESS_METALLIC } from '../../../CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, defUniformNamed, discard, div, fract, gt, ifThen, insert, length, main, mul, normalize, retFn, sub, sw, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { calcShadowDepth } from '../../../../shaders/modules/calcShadowDepth';

export const trailsRenderFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vDice = defInNamed( 'vec4', 'vDice' );
  const vJumpFlag = defInNamed( 'float', 'vJumpFlag' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );

  main( () => {
    ifThen( gt( vJumpFlag, 1E-4 ), () => discard() );

    if ( tag === 'depth' ) {
      const posXYZ = sw( vPosition, 'xyz' );

      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcShadowDepth( len ) );
      retFn();

    }

    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const haha = fract( mul( 100.0, vDice ) );

    assign( fragColor, vec4( vec3( mul( sw( haha, 'x' ), sw( haha, 'x' ) ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );
