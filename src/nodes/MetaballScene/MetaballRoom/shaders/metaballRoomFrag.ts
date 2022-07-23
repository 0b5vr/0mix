import { MTL_PBR_EMISSIVE3_ROUGHNESS } from '../../../CameraStack/deferredConstants';
import { add, assign, build, defInNamed, defOut, defUniformNamed, div, insert, main, mul, normalize, sin, step, sw, vec3, vec4 } from '../../../../shaders/shaderBuilder';

export const metaballRoomFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const emi = mul(
      vec3( 100.0, 0.0, 0.0 ),
      step( 0.99, sin( add( mul( 0.5, sw( vPosition, 'y' ) ), mul( 4.0, time ) ) ) ),
    );

    assign( fragColor, vec4( 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_EMISSIVE3_ROUGHNESS ) );
    assign( fragMisc, vec4( emi, 0.9 ) );
    return;
  } );
} );
