import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, length, mad, main, mul, normalize, retFn, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { raymarch } from '../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const sphereFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( p, mul( 0.1, cyclicNoise( mad( time, 2.0, p ), { warp: 0.2, freq: 1.5 } ) ) );
    const d = sub( length( p ), 0.8 );
    retFn( vec4( d, 0.0, 0.0, 1.0 ) );
  } );
  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add(
      map( p ),
      vec4( sw( mul( 0.0002, cyclicNoise( mad( 1000.0, 80.0, p ), { warp: 0.4 } ) ), 'x' ) ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 50,
      ro,
      rd,
      map,
      discardThreshold: tag === 'depth' ? 1E-1 : 1E-2,
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map: mapForN } ) );

    assign( fragColor, vec4( vec3( 0.5 ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.02, 0.0, 0.0, 0.0 ) );

  } );
} );
