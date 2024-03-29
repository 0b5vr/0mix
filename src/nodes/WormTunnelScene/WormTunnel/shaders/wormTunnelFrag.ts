import { MTL_PBR_ROUGHNESS_METALLIC } from '../../../CameraStack/deferredConstants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, forLoop, glFragDepth, glslFalse, glslTrue, ifThen, insert, length, main, mul, mulAssign, normalize, retFn, sub, sw, texture, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { calcNormal } from '../../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../../shaders/modules/calcShadowDepth';
import { perlin3d } from '../../../../shaders/modules/perlin3d';
import { raymarch } from '../../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../../shaders/modules/setupRoRd';
import { triplanarMapping } from '../../../../shaders/modules/triplanarMapping';

export const wormTunnelFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const isAfterMarch = def( 'bool', glslFalse );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );

    const scale = def( 'float', 1.0 );
    forLoop( tag === 'depth' ? 1 : 3, () => {
      addAssign( pt, div(
        perlin3d( mul( add( p, mul( vec3( 0.0, 0.5, 0.5 ), time ) ), 0.3, scale ) ),
        scale,
      ) );
      mulAssign( scale, 2.7 );
    } );

    const d = def( 'float', sub( 1.1, length( sw( pt, 'xy' ) ) ) );

    ifThen( isAfterMarch, () => {
      addAssign( d, mul( sw( triplanarMapping(
        pt,
        normalize( mul( pt, vec3( 1.0, 1.0, 0.0 ) ) ),
        1.0,
        ( uv ) => texture( sampler0, uv )
      ), 'z' ), 0.1 ) );
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: tag === 'depth' ? 20 : 40,
      ro,
      rd,
      map,
      marchMultiplier: 0.9,
      // discardThreshold: 1E-2, // too much artifacts, how bout no hit test
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

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );
    const roughness = 0.13;
    const metallic = 0.0;
    const baseColor = vec3( 0.1 );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

  } );
} );
