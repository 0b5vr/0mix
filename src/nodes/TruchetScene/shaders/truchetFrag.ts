import { GLSLExpression, GLSLFloatExpression, abs, add, addAssign, assign, atan, build, clamp, cos, def, defFn, defInNamed, defOut, defUniformNamed, div, dot, floor, glFragDepth, ifThen, insert, length, lte, mad, main, max, min, mix, mul, mulAssign, neg, normalize, num, pow, retFn, sign, step, sub, subAssign, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { TAU } from '../../../utils/constants';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { pcg3df } from '../../../shaders/modules/pcg3df';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sdbox } from '../../../shaders/modules/sdbox';
import { sdbox2 } from '../../../shaders/modules/sdbox2';
import { sdtorus } from '../../../shaders/modules/sdtorus';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';
import { smin } from '../../../shaders/modules/smin';

export const truchetFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const rlGlobal = def( 'float' );

  const { init } = glslDefRandom();

  const thicknessFn = ( t: GLSLFloatExpression ): GLSLExpression<'float'> => add(
    0.07,
    min( 0.0, mul( 0.5, sub( rlGlobal, 1.0 ) ) ),
    mul( 0.01, pow( mad( 0.5, cos( t ), 0.5 ), 5.0 ) ),
  );

  const sdtorusmetal = defFn( 'float', [ 'vec3' ], ( p ) => {
    const t = atan( sw( p, 'y' ), sw( p, 'x' ) );
    retFn( sdtorus(
      p,
      0.375,
      thicknessFn( mul( 24.0, t ) ),
    ) );
  } );

  const sdcylindermetal = defFn( 'float', [ 'vec3', 'float' ], ( p, l ) => {
    retFn( sdbox2(
      vec2( length( sw( p, 'xy' ) ), sw( p, 'z' ) ),
      vec2( thicknessFn( mul( 8.0, TAU, sw( p, 'z' ) ) ), l ),
    ) );
  } );

  const map = defFn( 'vec4', [ 'vec3', 'vec3' ], ( p, cell ) => {
    const pt = def( 'vec3', p );
    subAssign( pt, cell );

    const dice = def( 'vec3', pcg3df( cell ) );
    mulAssign( sw( pt, 'yz' ), rotate2D( mul( TAU, glslLofi( sw( dice, 'x' ), 0.25 ) ) ) );
    mulAssign( sw( pt, 'zx' ), rotate2D( mul( TAU, glslLofi( sw( dice, 'y' ), 0.25 ) ) ) );
    mulAssign( sw( pt, 'xy' ), rotate2D( mul( TAU, glslLofi( sw( dice, 'z' ), 0.25 ) ) ) );

    const dice2 = def( 'vec3', pcg3df( add( cell, 0.5 ) ) );

    const dbound = def( 'float', sdbox( pt, vec3( 0.5 ) ) );
    const dbound2 = def( 'float', sdbox( pt, vec3( 0.375 ) ) );

    // curves of xy
    const d1 = def( 'float', mix(
      sdtorusmetal( sub( pt, vec3( 0.375, 0.375, 0.0 ) ) ),
      1E9,
      step( sw( dice2, 'x' ), 0.4 ),
    ) );
    assign( d1, min( d1, mix(
      sdtorusmetal( add( pt, vec3( 0.375, 0.375, 0.0 ) ) ),
      1E9,
      step( sw( dice2, 'y' ), 0.4 ),
    ) ) );
    assign( d1, max( d1, dbound2 ) );

    // straights of xy
    const d2 = def( 'float', sdcylindermetal( sw( pt, 'yzx' ), num( 0.5 ) ) );
    assign( d2, min( d2, sdcylindermetal( sw( pt, 'zxy' ), num( 0.5 ) ) ) );
    assign( d2, max( d2, max( dbound, neg( dbound2 ) ) ) );

    // straight of z
    const d3 = def( 'float', sdcylindermetal( pt, num( 0.5 ) ) );
    assign( d3, max( d3, mix(
      -1E9,
      neg( dbound2 ),
      step( sw( dice2, 'z' ), 0.4 ),
    ) ) );

    retFn( vec4( smin( min( d1, d2 ), d3, 0.15 ), 0, 0, 0 ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3', 'vec3' ], ( p, cell ) => {
    const displace = def( 'vec3', cyclicNoise( mul( 16.0, p ) ) );
    assign( displace, mul( 0.005, sign( displace ), pow( abs( displace ), vec3( 3.0 ) ) ) );
    addAssign( p, displace );

    retFn( map( p, cell ) );
  } );

  const gridTraversal = defFn( 'vec4', [ 'vec3', 'vec3' ], ( ro, rd ) => {
    const cell = def( 'vec3', add(
      floor( add( ro, mul( rd, 0.01 ) ) ),
      0.5,
    ) );

    const src = neg( div( sub( ro, cell ), rd ) );
    const dst = abs( div( 0.5, rd ) );
    const bv = def( 'vec3', add( src, dst ) );
    const len = def( 'float', min( sw( bv, 'x' ), min( sw( bv, 'y' ), sw( bv, 'z' ) ) ) );

    retFn( vec4( cell, len ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );
    const grid = def( 'vec4', gridTraversal( ro, rd ) );
    const gridl = def( 'float', sw( grid, 'w' ) );

    const { rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map: ( p ) => map( p, sw( grid, 'xyz' ) ),
      marchMultiplier: 0.8,
      discardThreshold: 1E-2,
      beforeMapHook( { rl, rp } ) {
        ifThen( lte( gridl, rl ), () => {
          assign( rl, gridl );
          assign( rp, mad( rl, rd, ro ) );
          assign( grid, gridTraversal( rp, rd ) );
          addAssign( gridl, sw( grid, 'w' ) );
        } );

        assign( rlGlobal, rl );
      },
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    // normal with sanitization
    const N = def( 'vec3', calcNormal( {
      rp,
      map: ( p ) => mapForN( p, sw( grid, 'xyz' ) ),
      delta: 1E-4,
    } ) );
    const N2 = def( 'vec3', calcNormal( {
      rp,
      map: ( p ) => mapForN( p, sw( grid, 'xyz' ) ),
      delta: 1E-2,
    } ) );
    assign( N, mix( N2, clamp( N, -1.0, 1.0 ), glslSaturate( dot( N, N2 ) ) ) );

    assign( fragColor, vec4( 0.1, 0.1, 0.1, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.3, 1.0, 0.0, 0.0 ) );

  } );
} );
