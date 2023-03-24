import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, mad, main, mix, mul, normalize, retFn, sub, subAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { raymarch } from '../../../shaders/modules/raymarch';
import { sdbox } from '../../../shaders/modules/sdbox';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const keycapFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vOffset = defInNamed( 'vec3', 'vOffset' );
  const vInstance = defInNamed( 'vec4', 'vInstance' );
  const u = sw( vInstance, 'z' );

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
    subAssign( p, vOffset );

    const yt = clamp( sw( p, 'y' ), -1.0, 1.0 );
    const xt2 = clamp( div( sw( p, 'x' ), u ), -1.0, 1.0 );
    const yt2 = mad( 0.5, yt, 0.5 );
    const zt2 = clamp( sw( p, 'y' ), -1.0, 1.0 );
    addAssign( sw( p, 'y' ), mix(
      mul( -0.3, xt2, xt2, yt2, yt2 ),
      mul( sub( mul( 0.3, zt2, zt2 ), 0.3 ), yt2, yt2 ),
      sw( vInstance, 'w' ),
    ) ); // curve
    addAssign( sw( p, 'z' ), mul( 0.15, clamp( sw( p, 'y' ), -0.5, 0.5 ) ) ); // skew
    const wsub = mad( 0.3, yt, 0.25 );
    const d = sub( sdbox( p, vec3( sub( u, wsub ), 0.4, sub( 1.0, wsub ) ) ), 0.05 );

    retFn( vec4( d, 0.0, 0.0, 1.0 ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add(
      map( p ),
      vec4( sw( mul( 0.001, cyclicNoise( mul( 20.0, p ), { warp: 0.4 } ) ), 'x' ) ),
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

    const N = def( 'vec3', calcNormal( { rp, map: mapForN, delta: 1E-5 } ) );

    assign( fragColor, vec4( 0.04, 0.04, 0.04, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.1, 0.0, 0.0, 0.0 ) );

  } );
} );
