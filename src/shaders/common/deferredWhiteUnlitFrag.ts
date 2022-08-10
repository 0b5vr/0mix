import { MTL_UNLIT } from '../../nodes/CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, div, insert, main, normalize, sw, vec4 } from '../shaderBuilder';

export const deferredWhiteUnlitFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, vec4( 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );
    return;
  } );
} );
