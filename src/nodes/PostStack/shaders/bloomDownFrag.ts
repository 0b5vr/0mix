import { add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, div, dot, insert, lt, main, max, mix, mul, retFn, sub, sw, tern, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { downsampleTap13 } from '../../../shaders/modules/downsampleTap13';

export const bloomDownFrag = ( useLevelModifier: boolean ): string => build( () => {
  insert( 'precision highp float;' );

  const LUMA = vec3( 0.299, 0.587, 0.114 );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const gain = defUniformNamed( 'float', 'gain' );
  const bias = defUniformNamed( 'float', 'bias' );
  const srcRange = defUniformNamed( 'vec4', 'srcRange' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const fetchWithWeight = defFn( 'vec4', [ 'vec2' ], ( uv ) => {
    const tex = def( 'vec3', sw( texture( sampler0, uv ), 'xyz' ) );
    const luma = dot( LUMA, tex );
    retFn( vec4( tex, add( 1.0, mul( 0.5, luma ) ) ) );
  } );

  main( () => {
    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const uv0 = sw( srcRange, 'xy' );
    const uv1 = sw( srcRange, 'zw' );
    const uv = def( 'vec2', mix( uv0, uv1, vUv ) );
    assign( uv, clamp(
      uv,
      add( uv0, deltaTexel ),
      sub( uv1, deltaTexel ),
    ) );

    const accum = def( 'vec4' );
    downsampleTap13( ( weight, offset ) => {
      const tex = fetchWithWeight( sub( uv, mul( deltaTexel, offset ) ) );
      addAssign( accum, mul( weight, tex ) );
    } );

    const col = def( 'vec3', div( sw( accum, 'rgb' ), sw( accum, 'w' ) ) );

    if ( useLevelModifier ) {
      const brightness = def( 'float', dot( LUMA, col ) );
      const normalized = tern( lt( brightness, 1E-4 ), vec3( brightness ), div( col, brightness ) );
      assign( col, mul( gain, max( 0.0, add( brightness, bias ) ), normalized ) );
    }

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
