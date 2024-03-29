import { INV_PI } from '../../../utils/constants';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, mad, main, mul, normalize, retFn, sq, sw, vec4 } from '../../../shaders/shaderBuilder';
import { calcL } from '../../../shaders/modules/calcL';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcSS } from '../../../shaders/modules/calcSS';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { defMetaballMap } from '../defMetaballMap';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const metaballFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const map = defMetaballMap( time );
  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add( map( p ), vec4( mul( 0.00015, perlin3d( mad( 80.0, p, 1000.0 ) ) ) ) ) );
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

    const ssAccum = def( 'float', 0.0 );

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
        sw( lightColor, 'x' ),
        0.01,
        div( 1.0, sq( lenL ) ), // falloff
        calcSS( {
          rp,
          rd,
          L,
          N,
          map,
          iter: 10,
          lenMultiplier: 0.01,
        } ),
        INV_PI,
      ) );
    } );

    assign( fragColor, vec4( 1.0, 1.0, 1.0, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.1, 0.0, ssAccum, 1.0 ) );

  } );
} );
