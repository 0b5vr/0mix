import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, defUniformNamed, discard, div, glPointCoord, ifThen, insert, length, lt, main, retFn, sub, sw, vec4 } from '../../../shaders/shaderBuilder';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';

export const dustRenderFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const emissive = defUniformNamed( 'float', 'emissive' );
  const color = defUniformNamed( 'vec4', 'color' );

  main( () => {
    ifThen( lt( 0.5, length( sub( glPointCoord, 0.5 ) ) ), () => discard() );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( vProjPosition ) );
      retFn();

    }

    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, color );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( 0.0, 0.0, 1.0, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 1.0, 0.0, emissive, 0.0 ) );

  } );
} );
