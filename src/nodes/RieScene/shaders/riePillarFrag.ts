import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { assign, build, defInNamed, defOut, div, insert, mad, main, mul, normalize, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { perlin3d } from '../../../shaders/modules/perlin3d';

export const riePillarFrag = build( () => {
  insert( 'precision highp float;' );

  const vNoiseCoord = defInNamed( 'vec3', 'vNoiseCoord' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const n = perlin3d( mul( 140.0, vNoiseCoord ) );

    assign( fragColor, vec4( vec3( mad( 0.2, 0.2, n ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );
