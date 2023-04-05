import { FAR } from '../../../config';
import { GLSLExpression, abs, add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, eq, float, floor, forLoop, glFragDepth, gte, ifThen, insert, length, lt, mad, main, max, mixStepChain, mod, mul, mulAssign, neg, normalize, num, reflect, retFn, sign, step, sub, subAssign, sw, tern, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { fresnelSchlick } from '../../../shaders/modules/fresnelSchlick';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLinearstep } from '../../../shaders/modules/glslLinearstep';
import { isectBox } from '../../../shaders/modules/isectBox';
import { isectPlane } from '../../../shaders/modules/isectPlane';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const metalCubeFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const rotObject = defFn( 'vec3', [ 'vec3' ], ( p ) => {
    mulAssign( sw( p, 'zx' ), rotate2D( time ) );
    mulAssign( sw( p, 'xy' ), rotate2D( -1.0 ) );
    mulAssign( sw( p, 'yz' ), rotate2D( -1.0 ) );
    retFn( p );
  } );

  const invRotObject = defFn( 'vec3', [ 'vec3' ], ( p ) => {
    mulAssign( sw( p, 'yz' ), rotate2D( 1.0 ) );
    mulAssign( sw( p, 'xy' ), rotate2D( 1.0 ) );
    mulAssign( sw( p, 'zx' ), rotate2D( neg( time ) ) );
    retFn( p );
  } );

  /**
   * Fake rounded box. Intended to be used for bevels.
   */
  const isectRoundedBox = defFn( 'vec4', [ 'vec3', 'vec3', 'vec3', 'float' ], ( ro, rd, s, r ) => {
    const isect = def( 'vec4', isectBox( ro, rd, s ) );
    const d = def( 'float', sw( isect, 'w' ) );

    ifThen( gte( d, FAR ), () => retFn( vec4( FAR ) ) );

    const rp = def( 'vec3', mad( rd, d, ro ) );

    const st = def( 'vec3', sub( s, r ) );
    const rpt = def( 'vec3', clamp( rp, neg( st ), st ) );
    const N = normalize( sub( rp, rpt ) );

    addAssign( d, mul(
      0.01,
      r,
      length( sub( N, sw( isect, 'xyz' ) ) ),
    ) );

    retFn( vec4( N, d ) );
  } );

  const isectObject = defFn( 'vec4', [ 'vec3', 'vec3' ], ( ro, rd ) => {
    const isect = def( 'vec4', vec4( FAR ) );

    assign( ro, rotObject( ro ) );
    assign( rd, rotObject( rd ) );

    const rot = def( 'vec3' );

    forLoop( 12, ( i ) => {
      const fi = float( i );
      const phase = def( 'float', mod( sub( mul( 0.5, time ), fi ), 6.0 ) );

      ifThen( lt( phase, 2.9 ), () => {
        assign( rot, ro );

        const start = mul( 0.3, glslLinearstep( 1.9, 2.9, phase ) );
        const end = mul( 0.3, glslLinearstep( 0.0, 1.0, phase ) );

        const flip = mad( 2.0, floor( div( fi, 6.0 ) ), -1.0 );

        subAssign( rot, mul( flip, mixStepChain(
          mod( fi, 6.0 ),
          vec3( -0.3 ),
          [ 1.0, vec3( 0.3, -0.3, -0.3 ) ],
          [ 2.0, vec3( 0.3, 0.3, -0.3 ) ],
          [ 3.0, vec3( 0.3, 0.3, 0.3 ) ],
          [ 4.0, vec3( -0.3, 0.3, 0.3 ) ],
          [ 5.0, vec3( -0.3, 0.3, -0.3 ) ],
        ) ) );
        const dir = def( 'vec3', mul( flip, mixStepChain(
          mod( fi, 6.0 ),
          vec3( 1.0, 0.0, 0.0 ),
          [ 1.0, vec3( 0.0, 1.0, 0.0 ) ],
          [ 2.0, vec3( 0.0, 0.0, 1.0 ) ],
          [ 3.0, vec3( -1.0, 0.0, 0.0 ) ],
          [ 4.0, vec3( 0.0, 0.0, -1.0 ) ],
          [ 5.0, vec3( 0.0, -1.0, 0.0 ) ],
        ) ) );

        subAssign( rot, mul( dir, add( start, end ) ) );

        const s = mad( abs( dir ), sub( end, start, 1E-3 ), 0.15 );
        const isect2 = def( 'vec4', isectRoundedBox( rot, rd, s, num( 0.01 ) ) );

        assign( isect, tern(
          lt( sw( isect2, 'w' ), sw( isect, 'w' ) ),
          isect2,
          isect,
        ) );
      } );

    } );

    assign( sw( isect, 'xyz' ), invRotObject( sw( isect, 'xyz' ) ) );

    retFn( isect );
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

      mulAssign( colRem, fresnelSchlick( dotVH, num( 0.5 ), num( 1.0 ) ) );
      mulAssign( colRem, step( 0.0, dot( rd, N ) ) );
    };

    forLoop( 20, () => {
      const isect = def( 'vec4', isectObject( ro, rd ) );

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
        mulAssign( ro, sign( sw( rd, 'x' ) ) );
        mulAssign( rd, sign( sw( rd, 'x' ) ) );

        const plane = def( 'float', isectPlane(
          sub( ro, vec3( 5.0, 0.0, 0.0 ) ),
          rd,
          vec3( -1.0, 0.0, 0.0 ),
        ) );
        const rp = def( 'vec3', mad( plane, rd, ro ) );
        const planeLight = mul(
          step( plane, sub( FAR, 1E-3 ) ),
          step( abs( sw( rp, 'y' ) ), 4.0 ),
          step( abs( sw( rp, 'z' ) ), 4.0 ),
        );

        addAssign( col, mul( colRem, add(
          planeLight,
          // mul( 10.0, phongSpecular( rd, vec3( 0.0, 1.0, 0.0 ), 10.0 ) ),
          // mul( 10.0, phongSpecular( rd, vec3( 3.0, -1.0, 1.0 ), 10.0 ) ),
        ) ) );

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
