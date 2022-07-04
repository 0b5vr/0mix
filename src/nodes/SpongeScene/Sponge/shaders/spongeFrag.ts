import { MTL_PBR_ROUGHNESS_METALLIC } from '../../../CameraStack/shaders/deferredShadeFrag';
import { abs, add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mod, mul, neg, normalize, retFn, sub, sw, unrollLoop, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { calcShadowDepth } from '../../../../shaders/modules/calcDepth';
import { calcNormal } from '../../../../shaders/modules/calcNormal';
import { raymarch } from '../../../../shaders/modules/raymarch';
import { sdbox } from '../../../../shaders/modules/sdbox';
import { setupRoRd } from '../../../../shaders/modules/setupRoRd';
import { sortVec3Components } from '../../../../shaders/modules/sortVec3Components';

export const mengerSpongeFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const d = def( 'float', sdbox( p, vec3( 0.5 ) ) );

    let scale = 1.0;
    unrollLoop( tag === 'depth' ? 3 : 5, () => {
      const pt = def( 'vec3', abs( sub( mod( add( p, scale / 2.0 ), scale ), scale / 2.0 ) ) );
      assign( pt, sortVec3Components( pt ) );
      assign( d, max( d, neg( sdbox( pt, vec3( scale / 6.0, scale / 6.0, 9 ) ) ) ) );
      scale /= 3.0;
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      initRl: length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
    } );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-6 } ) );
    const roughness = 0.5;
    const metallic = 0.0;
    const baseColor = vec3( 0.7 );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcShadowDepth( cameraNearFar, len ) );
      retFn();

    }

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

  } );
} );
