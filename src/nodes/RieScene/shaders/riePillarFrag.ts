import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, exp2, floor, glFragDepth, glslFalse, glslTrue, insert, length, mad, main, min, mul, mulAssign, neg, normalize, retFn, smoothstep, subAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
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
      sdbox( p, vec3( 10.0, 0.1, 0.08 ) ),
      sdbox( p, vec3( 10.0, 0.08, 0.1 ) ),
    ) );

    addAssign( sw( p, 'x' ), mul( 10.0, instanceX ) );
    const noise = mul(
      add( 0.1, smoothstep( 0.1, 0.15, length( sw( p, 'yz' ) ) ) ),
      sw( cyclicNoise(
        mul( exp2( mad( 2.0, 1.0, sw( pcg3df( vec3( instanceX ) ), 'x' ) ) ), p ),
        { warp: 0.5, pump: 2.0, rot: vec3( 1.0, 3.0, -5.0 ) },
      ), 'x' ),
    );

    addAssign( d, mul( 0.1, smoothstep( 0.2, 1.0, noise ) ) );

    retFn( vec4( d ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pNoise = def( 'vec3', add( transformP( p ), instanceX ) );

    retFn( add(
      map( p ),
      mul( 0.005, smoothstep( 0.1, 1.0, perlin3d( mul( 50.0, pNoise ) ) ) ),
      mul( 0.004, smoothstep( 0.1, 1.0, perlin3d( mul( 200.0, pNoise ) ) ) ),
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
      marchMultiplier: 0.8,
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
    const N = def( 'vec3', calcNormal( { rp, map: mapForN, delta: 1E-3 } ) );

    assign( fragColor, vec4( 0.5, 0.5, 0.5, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.8, 0.0, 0.0, 0.0 ) );

  } );
} );
