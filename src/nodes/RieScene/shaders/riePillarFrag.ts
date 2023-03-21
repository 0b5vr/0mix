import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, exp2, floor, glFragDepth, glslFalse, glslTrue, insert, length, main, min, mod, mul, mulAssign, neg, normalize, retFn, smoothstep, sub, subAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { pcg3df } from '../../../shaders/modules/pcg3df';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sdbox } from '../../../shaders/modules/sdbox';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const riePillarFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vInstance = defInNamed( 'vec3', 'vInstance' );
  const instanceX = floor( add( 0.5, sw( vInstance, 'x' ) ) );

  const isAfterMarch = def( 'bool', glslFalse );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );

  const transformP = defFn( 'vec3', [ 'vec3' ], ( p ) => {
    mulAssign( sw( p, 'xy' ), rotate2D( neg( sw( vInstance, 'z' ) ) ) );
    subAssign( sw( p, 'y' ), 0.5 );
    subAssign( sw( p, 'z' ), sw( vInstance, 'y' ) );

    retFn( p );
  } );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    assign( p, transformP( p ) );

    const d = def( 'float', min(
      sdbox( p, vec3( 10.0, 0.09, 0.1 ) ),
      sdbox( p, vec3( 10.0, 0.1, 0.09 ) ),
    ) );

    addAssign( sw( p, 'x' ), mul( 10.0, instanceX ) );

    const noise = mul(
      smoothstep( 0.05, 0.15, length( sw( p, 'yz' ) ) ),
      sw( cyclicNoise(
        mul( exp2( mul( 2.0, sw( pcg3df( vec3( instanceX ) ), 'x' ) ) ), p ),
        { warp: 0.3, pump: 2.0, rot: vec3( 1.0, 3.0, -5.0 ) },
      ), 'x' ),
    );

    addAssign( d, mul( 0.2, smoothstep( 0.4, 1.0, noise ) ) );

    retFn( vec4( d, 0.0, 0.0, 1.0 ) );
  } );

  const fnForm = defFn( 'float', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', transformP( p ) );
    const pNoise = def( 'vec3', add( pt, instanceX ) );

    assign( sw( pt, 'x' ), sub( mod( sw( pt, 'x' ), 0.4 ), 0.2 ) );

    retFn( add(
      mul( 0.001, smoothstep( 0.2, 0.5, perlin3d( mul( 50.0, pNoise ) ) ) ),
      mul( 0.001, smoothstep( 0.1, 0.5, perlin3d( mul( 200.0, pNoise ) ) ) ),
      mul( -0.001, smoothstep( 0.02, 0.025, length( sw( pt, 'xy' ) ) ) ),
    ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add(
      map( p ),
      fnForm( p ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 10,
      ro,
      rd,
      map,
      marchMultiplier: 0.5,
      discardThreshold: 1E-1,
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
    const N = def( 'vec3', calcNormal( { rp, map: mapForN, delta: 1E-4 } ) );

    const pNoise = def( 'vec3', add( transformP( rp ), mul( 10.0, instanceX ) ) );
    const dirt = def( 'float', glslSaturate( add(
      0.6,
      mul( 0.1, perlin3d( mul( vec3( 5.0, 100.0, 100.0 ), pNoise ) ) ),
      mul( 0.2, perlin3d( mul( 200.0, pNoise ) ) ),
      mul( -70.0, fnForm( rp ) ),
    ) ) );
    mulAssign( dirt, dirt );

    assign( fragColor, vec4( vec3( dirt ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.5, 0.0, 0.0, 0.0 ) );

  } );
} );
