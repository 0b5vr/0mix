import { INV_PI } from '../../../utils/constants';
import { MTL_PBR_EMISSIVE3_ROUGHNESS } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, length, mad, main, mul, normalize, retFn, sin, sq, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcL } from '../../../shaders/modules/calcL';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcSS } from '../../../shaders/modules/calcSS';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const stoneFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );

    addAssign( pt, mul( 0.12, perlin3d( mul( 2.0, add( pt, mul( 0.3, time ) ) ) ) ) );
    addAssign( pt, mul( 0.01, perlin3d( mul( 7.0, add( pt, mul( 0.1, time ) ) ) ) ) );

    const stripe = def( 'float', step( 0.0, sin( add( time, mul( 20.0, sw( pt, 'z' ) ) ) ) ) );

    const d = sub( length( pt ), 0.8 );
    retFn( vec4( d, stripe, 0.0, 0.0 ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add( map( p ), vec4( mul( 0.00015, perlin3d( mad( 1000.0, 80.0, p ) ) ) ) ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { isect, rp } = raymarch( {
      iter: 50,
      ro,
      rd,
      map,
      marchMultiplier: 0.8,
      discardThreshold: tag === 'depth' ? 1E-1 : 1E-2,
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 0.1 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map: mapForN } ) );

    const ssAccum = def( 'vec3', vec3( 0.0 ) );

    forEachLights( ( { lightPos, lightColor } ) => {
      const [ L ] = calcL(
        mul( modelMatrixT3, lightPos ),
        rp,
      );

      const [ _L, lenL ] = calcL(
        lightPos,
        sw( mul( modelMatrix, vec4( rp, 1.0 ) ), 'xyz' ),
      );

      addAssign( ssAccum, mul(
        lightColor,
        div( 1.0, sq( lenL ) ), // falloff
        // 1.0, // subsurfaceColor
        calcSS( {
          rp,
          rd,
          L,
          N,
          map,
          iter: 20,
          lenMultiplier: 0.01,
        } ),
        INV_PI,
      ) );
    } );

    assign( fragColor, vec4( vec3( sw( isect, 'y' ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_EMISSIVE3_ROUGHNESS ) );
    assign( fragMisc, vec4( ssAccum, 0.1 ) );

  } );
} );
