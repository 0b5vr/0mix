import { MTL_UNLIT } from '../../../CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, div, insert, main, mul, smoothstep, sw, vec3, vec4 } from '../../../../shaders/shaderBuilder';

export const pillarGridFrameFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, vec4(
      vec3( mul( 0.5, smoothstep( 0.5, 0.8, sw( vPosition, 'z' ) ) ) ),
      1.0,
    ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( vec3( 0.0, 0.0, 1.0 ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );
    return;
  } );
} );
