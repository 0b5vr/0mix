import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { abs, add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, forLoop, glFragDepth, ifThen, insert, lt, mad, main, max, min, mod, mul, mulAssign, neg, normalize, retFn, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { foldSortXYZ } from '../../../shaders/modules/foldSortXYZ';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { orthBas } from '../../../shaders/modules/orthBas';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { sdbox } from '../../../shaders/modules/sdbox';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const obsvrLogoFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const { init } = glslDefRandom();

  const ifs = defFn( 'vec3', [ 'vec3', 'vec3', 'vec3' ], ( p, r, s ) => {
    const b = def( 'mat3', orthBas( r ) );

    forLoop( 5, () => {
      assign( p, abs( p ) );
      assign( p, foldSortXYZ( p ) );
      mulAssign( s, b );
      mulAssign( s, 0.58 );
      assign( p, sub( abs( p ), abs( s ) ) );
    } );

    retFn( p );
  } );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d0 = def( 'float', sdbox( p, vec3( 0.2, 0.2, 0.2 ) ) );
    assign( d0, min( d0, sdbox( sub( p, vec3( 0.0, 0.8, 0.0 ) ), vec3( 0.6, 0.2, 0.2 ) ) ) );
    assign( d0, min( d0, sdbox( sub( p, vec3( 0.0, -0.8, 0.0 ) ), vec3( 0.6, 0.2, 0.2 ) ) ) );
    assign( d0, min( d0, sdbox( sub( p, vec3( 0.8, 0.0, 0.0 ) ), vec3( 0.2, 0.6, 0.2 ) ) ) );
    assign( d0, min( d0, sdbox( sub( p, vec3( -0.8, 0.0, 0.0 ) ), vec3( 0.2, 0.6, 0.2 ) ) ) );

    const pt = def( 'vec3' );
    const d = def( 'float', d0 );
    const d2 = def( 'float' );

    // greeble - add
    assign( pt, ifs( p, vec3( -1.7, 0.8, -0.5 ), vec3( 3.57, 2.15, 1.94 ) ) );
    assign( pt, sub( mod( add( pt, 0.04 ), 0.08 ), 0.04 ) );

    assign( d2, sub( sdbox( pt, vec3( 0.02, 0.014, 0.03 ) ), 0.003 ) );
    assign( d, min( d, max( d2, sub( d, 0.03 ) ) ) );

    // greeble - sub
    assign( pt, ifs( p, vec3( -1.9, -1.2, -1.4 ), vec3( 0.12, 1.59, 2.35 ) ) );
    assign( pt, sub( mod( add( pt, 0.02 ), 0.04 ), 0.02 ) );

    assign( d2, sdbox( pt, vec3( 0.015, 0.01, 0.03 ) ) );
    assign( d, max( d, neg( d2 ) ) );

    // make it glow
    assign( d2, add( d0, 0.01 ) );
    ifThen( lt( d2, d ), () => {
      retFn( vec4( d2, 1, 0, 0 ) );
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( add( map( p ), vec4( mul( 0.00015, perlin3d( mad( 1000.0, 80.0, p ) ) ) ) ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { isect, rp } = raymarch( {
      iter: 100,
      ro,
      rd,
      map,
      marchMultiplier: 0.7,
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

    const N = def( 'vec3', calcNormal( { rp, map: mapForN, delta: 1E-4 } ) );

    const emissive = mul( 100.0, step( 0.5, sw( isect, 'y' ) ) );

    assign( fragColor, vec4( 0.02, 0.02, 0.02, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 0.0, emissive, 0.0 ) );

  } );
} );
