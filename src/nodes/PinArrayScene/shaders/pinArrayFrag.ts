import { FAR } from '../../../config';
import { GLSLExpression, abs, add, addAssign, and, assign, build, def, defConst, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, eq, floor, forLoop, glFragDepth, gt, ifThen, insert, length, lt, mad, main, mat2, mat3, max, min, mod, mul, mulAssign, neg, normalize, num, reflect, retFn, step, sub, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { SQRT3 } from '../../../utils/constants';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { fresnelSchlick } from '../../../shaders/modules/fresnelSchlick';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { isectPillar } from '../../../shaders/modules/isectPillar';
import { isectPlane } from '../../../shaders/modules/isectPlane';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const pinArrayFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );

  const { init, random2 } = glslDefRandom();

  const HEX_SIZE = 0.04;

  // See: https://scrapbox.io/0b5vr/Hexagonal_Grid
  const findNearestHex = defFn( 'vec2', [ 'vec2' ], ( p ) => {
    const MAT_SKEW = defConst( 'mat2', mat2( 1.0, 1.0 / SQRT3, 0.0, 2.0 / SQRT3 ) );
    const INV_MAT_SKEW = defConst( 'mat2', mat2( 1.0, -0.5, 0.0, SQRT3 / 2.0 ) );

    const pt = def( 'vec2', div( mul( p, MAT_SKEW ), HEX_SIZE ) );
    const cell = def( 'vec2', floor( pt ) );
    addAssign( sw( cell, 'y' ), sub(
      mod( mad( 2.0, sw( cell, 'x' ), neg( sw( cell, 'y' ) ) ), 3.0 ),
      1.0,
    ) );

    const coord = sub( pt, cell );
    const isTopHalf = step( sw( coord, 'x' ), sw( coord, 'y' ) );
    addAssign( cell, vec2( sub( 1.0, isTopHalf ), isTopHalf ) );

    retFn( mul( cell, INV_MAT_SKEW, HEX_SIZE ) );
  } );

  // See: https://scrapbox.io/0b5vr/Hexagonal_Grid_Traversal
  const traverseHex = defFn( 'vec3', [ 'vec3', 'vec3' ], ( ro, rd ) => {
    const DIR = defConst( 'mat3', mat3(
      vec3( SQRT3 / 2.0, 0.5, 0.0 ),
      vec3( 0.0, 1.0, 0.0 ),
      vec3( -SQRT3 / 2.0, 0.5, 0.0 ),
    ) );

    const hex = def( 'vec2', findNearestHex( sw( mad( 1E-2 * HEX_SIZE, rd, ro ), 'xy' ) ) );

    const rdd = def( 'vec3', mul( rd, DIR ) );
    const src = div( mul( sub( vec3( hex, 0.0 ), ro ), DIR ), rdd );
    const dst = abs( div( SQRT3 / 2.0 * HEX_SIZE, rdd ) );

    const distv = add( src, dst );
    const dist = min( min( sw( distv, 'x' ), sw( distv, 'y' ) ), sw( distv, 'z' ) );

    retFn( vec3( hex, dist ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );
    const initRl = def( 'float', length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ) );
    addAssign( ro, mul( rd, initRl ) );

    const ro0 = def( 'vec3', ro );
    const rd0 = def( 'vec3', rd );

    const isFirstRay = def( 'float', 1.0 );

    const N0 = def( 'vec3' );
    const col = def( 'vec3', vec3( 0.0 ) );
    const colRem = def( 'vec3', vec3( 1.0 ) );
    const samples = def( 'float', 1.0 );

    const doMetal = ( N: GLSLExpression<'vec3'> ): void => {
      // reflective
      const h = def( 'vec3', sampleGGX(
        random2(),
        N,
        0.1, // roughness
      ) );

      const dotVH = def( 'float', max( 0.001, dot( neg( rd ), h ) ) );

      assign( rd, normalize( reflect( rd, h ) ) );

      mulAssign( colRem, fresnelSchlick( dotVH, num( 0.8 ), num( 1.0 ) ) );
      mulAssign( colRem, step( 0.0, dot( rd, N ) ) );
    };

    forLoop( 80, () => {
      const result = def( 'vec3', traverseHex( ro, rd ) );

      const noise = perlin3d( vec3( mul( 4.0, sw( result, 'xy' ) ), mul( 0.3, time ) ) );
      const rot = sub( ro, vec3( sw( result, 'xy' ), mad( 2.0, noise, -7.0 ) ) );
      const isect = def( 'vec4', isectPillar( rot, rd, 0.03, 5.0 ) );

      const N = sw( isect, 'xyz' );
      const isectlen = sw( isect, 'w' );

      ifThen( lt( isectlen, FAR ), () => {
        // update ray origin
        addAssign( ro, mul( rd, isectlen ) );

        // record the first ray
        ifThen( eq( isFirstRay, 1.0 ), () => {
          // smooth
          assign( ro0, ro );
          assign( N0, N );

          assign( isFirstRay, 0.0 );
        } );

        // reflect
        doMetal( N );
        addAssign( ro, mul( 1E-3, rd ) );

      }, () => {
        // update ray origin
        addAssign( ro, mul( rd, sw( result, 'z' ) ) );

      } );

      ifThen( and( gt( sw( ro, 'z' ), -0.0 ), gt( sw( rd, 'z' ), 0.0 ) ), () => {
        const plane = def( 'float', isectPlane(
          sub( ro, vec3( 0.0, 0.0, 5.0 ) ),
          rd,
          normalize( vec3( 0.0, 0.0, -1.0 ) ),
        ) );
        const planeLight = mul(
          step( plane, sub( FAR, 1E-3 ) ),
        );

        addAssign( col, mul( colRem, 0.5, planeLight ) );

        mulAssign( colRem, 0.0 );

      } );

      ifThen( lt( sw( colRem, 'x' ), 0.04 ), () => {
        assign( colRem, vec3( 1.0 ) );
        addAssign( samples, 1.0 );

        assign( ro, ro0 );
        assign( rd, rd0 );

        doMetal( N0 );
        addAssign( ro, mul( 1E-3, rd ) );

      } );
    } );

    ifThen( eq( N0, vec3( 0.0 ) ), () => {
      discard();
      retFn();
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( ro0, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( ro0, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    assign( fragColor, vec4( div( col, samples, 0.5 ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N0 ) ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );

  } );
} );
