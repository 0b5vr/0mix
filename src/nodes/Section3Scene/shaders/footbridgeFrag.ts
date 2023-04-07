import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, exp, glFragDepth, ifThen, insert, length, main, max, min, mix, mul, mulAssign, neg, normalize, retFn, step, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofir } from '../../../shaders/modules/glslLofir';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { sdbox } from '../../../shaders/modules/sdbox';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const footbridgeFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const isAfterMarch = def( 'float', 0.0 );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    assign( sw( p, 'z' ), abs( sw( p, 'z' ) ) );

    // base 1
    const d = def( 'float', (
      sdbox( sub( p, vec3( 0.0, -0.2, 0.0 ) ), vec3( 5.0, 0.05, 0.99 ) )
    ) );

    // base 2
    assign( d, min( d, (
      sdbox( sub( p, vec3( 0.0, -0.5, 0.0 ) ), vec3( 5.0, 0.15, 0.8 ) )
    ) ) );

    // base 3
    assign( d, min( d, (
      sdbox( sub( p, vec3( 0.0, -0.5, 0.8 ) ), vec3( 5.0, 0.25, 0.1 ) )
    ) ) );

    // tube h
    assign( d, min( d, (
      sub( length( sw( sub( p, vec3( 0.0, 0.5, 0.9 ) ), 'yz' ) ), 0.05 )
    ) ) );

    const pt = def( 'vec3', p );

    // base 3
    subAssign( sw( pt, 'x' ), glslLofir( sw( pt, 'x' ), 1.6 ) );
    assign( d, min( d, (
      sdbox( sub( pt, vec3( 0.0, -0.5, 0.0 ) ), vec3( 0.1, 0.2, 0.8 ) )
    ) ) );

    // tube v
    subAssign( sw( pt, 'x' ), glslLofir( sw( pt, 'x' ), 0.8 ) );
    assign( d, min( d, max(
      sub( length( sw( sub( pt, vec3( 0.0, 0.0, 0.9 ) ), 'zx' ) ), 0.04 ),
      sub( abs( sub( sw( pt, 'y' ), 0.15 ) ), 0.35 ),
    ) ) );

    // tube v2
    subAssign( sw( pt, 'x' ), glslLofir( sw( pt, 'x' ), 0.1 ) );
    assign( d, min( d, max(
      sub( length( sw( sub( pt, vec3( 0.0, 0.0, 0.9 ) ), 'zx' ) ), 0.015 ),
      sub( abs( sub( sw( pt, 'y' ), 0.15 ) ), 0.35 ),
    ) ) );

    ifThen( eq( isAfterMarch, 1.0 ), () => {
      addAssign( d, mul( 0.001, perlin3d( mul( 70.0, p ) ) ) );
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      marchMultiplier: 1.0,
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

    assign( isAfterMarch, 1.0 );

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-2 } ) );

    const dirt = def( 'float', 0.0 );
    addAssign( dirt, mul(
      step( sw( rp, 'y' ), -0.15 ),
      exp( mul( 2.0, add( sw( rp, 'y' ), 0.15 ) ) ),
    ) );

    // normal y
    addAssign( dirt, max( 0.0, neg( sw( N, 'y' ) ) ) );

    assign( dirt, glslSaturate( dirt ) );

    const uv = def( 'vec2', mul( vec2( 0.5, 0.125 ), sw( rp, 'xy' ) ) );
    addAssign( sw( uv, 'y' ), mul( 0.1, sw( rp, 'z' ) ) );
    mulAssign( dirt, sw( texture( sampler0, uv ), 'z' ) );

    assign( fragColor, vec4( mix( vec3( 0.2 ), vec3( 0.1 ), dirt ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( mix( 0.2, 0.7, dirt ), 0.0, 0.0, 1.0 ) );

  } );
} );
