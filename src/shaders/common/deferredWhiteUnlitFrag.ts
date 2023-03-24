import { MTL_UNLIT } from '../../nodes/CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, defUniformNamed, div, exp2, insert, main, sw, vec4 } from '../shaderBuilder';

export const deferredWhiteUnlitFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const strength = defUniformNamed( 'float', 'strength' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, vec4( exp2( strength ) ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( 0.0, 0.0, 1.0, MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );
    return;
  } );
} );
