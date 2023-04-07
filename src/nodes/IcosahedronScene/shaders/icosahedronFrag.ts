import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { PI } from '../../../utils/constants';
import { abs, add, assign, build, cos, def, defConst, defFn, defInNamed, defOut, defUniformNamed, div, dot, forLoop, glFragDepth, insert, main, min, mul, mulAssign, neg, normalize, retFn, sq, sqrt, sub, subAssign, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { orthBas } from '../../../shaders/modules/orthBas';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const icosahedronFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const foldcos = defConst( 'float', cos( div( PI, 5.0 ) ) );
  const foldrem = defConst( 'float', sqrt( sub( 0.75, sq( foldcos ) ) ) );
  const foldvec = defConst( 'vec3', vec3( -0.5, neg( foldcos ), foldrem ) );
  const foldsurf = defConst( 'vec3', normalize( vec3( 0.0, foldrem, foldcos ) ) );

  const isAfterMarch = def( 'float', 0.0 );

  const { init } = glslDefRandom();

  const icosafold = defFn( 'vec3', [ 'vec3' ], ( p ) => {
    assign( sw( p, 'xy' ), abs( sw( p, 'xy' ) ) );
    subAssign( p, mul( 2.0, min( 0.0, dot( p, foldvec ) ), foldvec ) );
    assign( sw( p, 'xy' ), abs( sw( p, 'xy' ) ) );
    subAssign( p, mul( 2.0, min( 0.0, dot( p, foldvec ) ), foldvec ) );
    assign( sw( p, 'xy' ), abs( sw( p, 'xy' ) ) );
    subAssign( p, mul( 2.0, min( 0.0, dot( p, foldvec ) ), foldvec ) );
    assign( sw( p, 'xy' ), abs( sw( p, 'xy' ) ) );
    subAssign( p, mul( 2.0, min( 0.0, dot( p, foldvec ) ), foldvec ) );
    assign( sw( p, 'xy' ), abs( sw( p, 'xy' ) ) );
    subAssign( p, mul( 2.0, min( 0.0, dot( p, foldvec ) ), foldvec ) );

    retFn( p );
  } );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const shift = def( 'vec3', mul( 0.4, foldsurf ) );

    forLoop( 5, () => {
      mulAssign( sw( p, 'zx' ), rotate2D( 0.6 ) );
      mulAssign( sw( p, 'yz' ), rotate2D( mul( 0.04, time ) ) );
      mulAssign( sw( p, 'xy' ), rotate2D( mul( -0.03, time ) ) );
      assign( p, abs( p ) );
      assign( p, icosafold( p ) );
      subAssign( p, abs( shift ) );
      mulAssign( shift, 0.5 );
      mulAssign( shift, orthBas( vec3( 5.0, 4.0, 3.0 ) ) );
    } );

    const d = def( 'float', sub( dot( foldsurf, p ), 0.1 ) );

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

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );

    assign( fragColor, vec4( 0.1, 0.1, 0.1, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 0.8, 0.0, 1.0 ) );

  } );
} );
