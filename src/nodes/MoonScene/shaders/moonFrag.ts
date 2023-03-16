import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, length, mad, main, mul, normalize, retFn, sq, sub, sw, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';
import { voronoi3d } from '../../../shaders/modules/voronoi3d';

export const moonFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sub( length( p ), 0.5 ) );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  const mapForN = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    retFn( sub(
      map( p ),
      sq( mul( 0.1, sw( voronoi3d( mul( 10.0, add( p, mul( 0.1, time ) ) ) ), 'w' ) ) ),
      vec4( mul( 0.0001, perlin3d( mad( 100.0, p, 1000.0 ) ) ) ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
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

    assign( fragColor, vec4( 0.5, 0.5, 0.5, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.9, 0.0, 0.0, 0.0 ) );

  } );
} );
