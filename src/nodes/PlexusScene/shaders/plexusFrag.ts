import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, discard, div, glPointCoord, gt, ifThen, insert, length, lt, mad, main, or, smoothstep, sub, sw, vec4 } from '../../../shaders/shaderBuilder';
import { bayerPattern4 } from '../../../shaders/modules/bayerPattern4';
import { glslLinearstep } from '../../../shaders/modules/glslLinearstep';

export const plexusFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vLength = defInNamed( 'float', 'vLength' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    ifThen(
      or(
        gt( vLength, 0.5 ), // connection is too far
        lt( 0.5, length( sub( glPointCoord, 0.5 ) ) ), // point sprite shape
        gt(
          bayerPattern4(),
          mad( 17.0, glslLinearstep( 0.0, 0.5, sw( vProjPosition, 'z' ) ), -1.0 ),
        ), // is too near to camera
      ),
      () => discard(),
    );

    assign( fragColor, vec4( smoothstep( 0.5, 0.4, vLength ) ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( 0.0, 0.0, 1.0, MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );
    return;
  } );
} );
