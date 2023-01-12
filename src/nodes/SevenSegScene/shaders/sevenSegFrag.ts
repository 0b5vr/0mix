import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, assign, build, defInNamed, defOut, discard, div, ifThen, insert, lt, main, mul, normalize, sw, vec4 } from '../../../shaders/shaderBuilder';
import { bayerPattern4 } from '../../../shaders/modules/bayerPattern4';

export const sevenSegFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vEmit = defInNamed( 'float', 'vEmit' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    ifThen(
      lt( add( div( bayerPattern4(), 16.0 ), sw( vProjPosition, 'z' ) ), 2.0 ),
      () => discard(),
    );

    assign( fragColor, vec4( 0.04, 0.04, 0.04, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.5, 0.0, mul( 40.0, vEmit ), 0.0 ) );
    return;
  } );
} );
