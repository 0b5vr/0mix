import { abs, add, assign, build, clamp, def, defInNamed, defOutNamed, defUniformNamed, div, dot, insert, lt, main, max, min, mul, or, sub, sw, tern, texture, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';

const FXAA_REDUCE_MIN = 1.0 / 128.0;
const FXAA_REDUCE_MUL = 1.0 / 8.0;
const FXAA_SPAN_MAX = 16.0;

const LUMA = vec3( 0.2126, 0.7152, 0.0722 );

export const fxaaFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const neighbor = def( 'vec4', div( vec4( -1.0, -1.0, 1.0, 1.0 ), sw( resolution, 'xyxy' ) ) );

    const rgb11 = sw( texture( sampler0, vUv ), 'xyz' );
    const rgb00 = sw( texture( sampler0, add( vUv, sw( neighbor, 'xy' ) ) ), 'xyz' );
    const rgb02 = sw( texture( sampler0, add( vUv, sw( neighbor, 'xw' ) ) ), 'xyz' );
    const rgb20 = sw( texture( sampler0, add( vUv, sw( neighbor, 'zy' ) ) ), 'xyz' );
    const rgb22 = sw( texture( sampler0, add( vUv, sw( neighbor, 'zw' ) ) ), 'xyz' );

    const luma11 = def( 'float', dot( LUMA, rgb11 ) );
    const luma00 = def( 'float', dot( LUMA, rgb00 ) );
    const luma02 = def( 'float', dot( LUMA, rgb02 ) );
    const luma20 = def( 'float', dot( LUMA, rgb20 ) );
    const luma22 = def( 'float', dot( LUMA, rgb22 ) );

    const lumaMin = min( luma11, min( min( luma00, luma02 ), min( luma20, luma22 ) ) );
    const lumaMax = max( luma11, max( max( luma00, luma02 ), max( luma20, luma22 ) ) );

    const dir = def( 'vec2', vec2(
      sub( add( luma02, luma22 ), add( luma00, luma20 ) ),
      sub( add( luma00, luma02 ), add( luma20, luma22 ) ),
    ) );
    const absdir = abs( dir );

    const dirReduce = max(
      mul( 0.25, add( luma00, luma02, luma20, luma22 ), FXAA_REDUCE_MUL ),
      FXAA_REDUCE_MIN,
    );

    const dirMin = add( min( sw( absdir, 'x' ), sw( absdir, 'y' ) ), dirReduce );
    assign( dir, div( clamp( div( dir, dirMin ), -FXAA_SPAN_MAX, FXAA_SPAN_MAX ), resolution ) );

    const rgbA = def( 'vec3', sw( mul( 0.5, add(
      texture( sampler0, add( vUv, mul( dir, ( 1.0 / 3.0 - 0.5 ) ) ) ),
      texture( sampler0, add( vUv, mul( dir, ( 2.0 / 3.0 - 0.5 ) ) ) ),
    ) ), 'xyz' ) );
    const rgbB = def( 'vec3', add(
      mul( 0.5, rgbA ),
      sw( mul( 0.25, add(
        texture( sampler0, add( vUv, mul( -0.5, dir ) ) ),
        texture( sampler0, add( vUv, mul( 0.5, dir ) ) ),
      ) ), 'xyz' ),
    ) );

    const lumaB = dot( LUMA, rgbB );
    assign( fragColor, tern(
      or( lt( lumaB, lumaMin ), lt( lumaMax, lumaB ) ),
      vec4( rgbA, 1.0 ),
      vec4( rgbB, 1.0 ),
    ) );
  } );
} );
