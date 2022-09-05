import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { abs, add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, gt, ifThen, insert, length, lt, main, max, mul, mulAssign, normalize, retFn, sub, subAssign, sw, tern, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const sphereArrayFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vInstance = defInNamed( 'vec2', 'vInstance' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    subAssign( sw( p, 'xy' ), mul( vInstance, 1.0 ) );
    mulAssign( sw( p, 'zx' ), rotate2D( add( time, sw( vInstance, 'x' ) ) ) );
    mulAssign( sw( p, 'yz' ), rotate2D( add( time, sw( vInstance, 'y' ) ) ) );
    const d = def( 'vec4', vec4( sub( length( p ), 0.06 ), 0.04, 0.0, 0.0 ) );

    const ring = sub( length( sw( p, 'xy' ) ), 0.08 );
    const d2 = def( 'vec4', vec4(
      sub( max(
        abs( ring ),
        abs( sw( p, 'z' ) ),
      ), 0.01 ),
      0.5,
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

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 50,
      ro,
      rd,
      map,
      initRl: length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
    } );

    ifThen( gt( sw( isect, 'x' ), tag === 'depth' ? 1E-1 : 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcShadowDepth( cameraNearFar, len ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );

    assign( fragColor, vec4( vec3( sw( isect, 'y' ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 1.0, 1.0, 0.0 ) );

  } );
} );

