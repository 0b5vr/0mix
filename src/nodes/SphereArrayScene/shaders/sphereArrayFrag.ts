import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, ifThen, insert, length, lt, main, max, mul, mulAssign, normalize, retFn, sub, subAssign, sw, tern, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { perlin2d } from '../../../shaders/modules/perlin2d';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const sphereArrayFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vInstance = defInNamed( 'vec2', 'vInstance' );

  const isAfterMarch = def( 'bool', glslFalse );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    subAssign( sw( p, 'xy' ), vInstance );

    const pt = def( 'vec3', p );
    mulAssign( sw( pt, 'zx' ), rotate2D( mul( 6.0, add( perlin2d( add( mul( 0.1, vInstance ), mul( 0.04, time ) ) ) ) ) ) );
    mulAssign( sw( pt, 'yz' ), rotate2D( mul( 6.0, add( mul( 0.1, time ), perlin2d( add( mul( 0.1, vInstance ), mul( 0.04, time ), 10.0 ) ) ) ) ) );

    ifThen( isAfterMarch, () => {
      addAssign( pt, mul( 0.0003, perlin3d( mul( 100.0, pt ) ) ) );
    } );
    const d = def( 'vec4', vec4( sub( length( pt ), 0.06 ), 0.0, 0.0, 0.0 ) );

    assign( pt, p );
    mulAssign( sw( pt, 'zx' ), rotate2D( mul( 6.0, add( perlin2d( add( mul( 0.4, vInstance ), mul( 0.04, time ) ) ) ) ) ) );
    mulAssign( sw( pt, 'yz' ), rotate2D( mul( 6.0, add( mul( 0.3, time ), perlin2d( add( mul( 0.4, vInstance ), mul( 0.04, time ), 10.0 ) ) ) ) ) );
    ifThen( isAfterMarch, () => {
      addAssign( pt, mul( 0.0003, perlin3d( mul( 900.0, pt ) ) ) );
    } );

    const ring = sub( length( sw( pt, 'xy' ) ), 0.08 );
    const d2 = def( 'vec4', vec4(
      sub( max(
        abs( ring ),
        abs( sw( pt, 'z' ) ),
      ), 0.01 ),
      1.0,
      0.0,
      0.0,
    ) );

    assign( d, tern( lt( sw( d2, 'x' ), sw( d, 'x' ) ), d2, d ) );
    retFn( vec4( d ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    const [ ro, rd ] = setupRoRd( p );

    const { isect, rp } = raymarch( {
      iter: 50,
      ro,
      rd,
      map,
      discardThreshold: 1E-2,
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    assign( isAfterMarch, glslTrue );
    const N = def( 'vec3', calcNormal( { rp, map } ) );

    assign( fragColor, tern(
      eq( sw( isect, 'y' ), 0.0 ),
      vec4( 0.02, 0.02, 0.02, 0.0 ),
      vec4( 1.0, 0.5, 0.3, 0.0 ),
    ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, tern(
      eq( sw( isect, 'y' ), 0.0 ),
      vec4( 0.3, 1.0, 1.0, 0.0 ),
      vec4( 0.1, 1.0, 1.0, 0.0 ),
    ) );

  } );
} );
