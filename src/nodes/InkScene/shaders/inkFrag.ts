import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, mad, main, mul, mulAssign, normalize, retFn, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const inkFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const slowtime = mul( 0.1, time );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    mulAssign( sw( p, 'xy' ), rotate2D( slowtime ) );

    const d = def( 'float', sw( p, 'z' ) );

    const perlin = def( 'float', add(
      perlin3d( mad( 4.0, p, slowtime ) ),
      mul( 0.4, perlin3d( mad( 21.0, p, slowtime ) ) ),
      mul( 0.01, perlin3d( mad( 800.0, p, slowtime ) ) ),
    ) );
    addAssign( d, mul( 0.05, perlin ) );

    const n = cyclicNoise( add(
      mul( 10.0, p ),
      mul( vec3( 0.0, 0.0, 2.0 ), perlin ),
    ), { warp: 0.5 } );
    addAssign( d, mul( 0.01, sw( n, 'x' ) ) );

    retFn( vec4( d, 0.0, 0.0, 1.0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 10,
      ro,
      rd,
      map,
      marchMultiplier: 0.9,
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

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );

    assign( fragColor, vec4( vec3( 0.5 ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.05, 0.0, 0.0, 0.0 ) );

  } );
} );
