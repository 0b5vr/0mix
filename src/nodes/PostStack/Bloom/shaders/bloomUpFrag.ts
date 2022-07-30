import { add, addAssign, assign, build, clamp, def, defInNamed, defOut, defUniformNamed, div, insert, main, mix, mul, sub, sw, texture, vec4 } from '../../../../shaders/shaderBuilder';
import { upsampleTap9 } from '../../../../shaders/modules/upsampleTap9';

export const bloomUpFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const srcRange = defUniformNamed( 'vec4', 'srcRange' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const uv0 = sw( srcRange, 'xy' );
    const uv1 = sw( srcRange, 'zw' );
    const uv = def( 'vec2', mix( uv0, uv1, vUv ) );
    assign( uv, clamp(
      uv,
      add( uv0, mul( 1.5, deltaTexel ) ),
      sub( uv1, mul( 1.5, deltaTexel ) ),
    ) );

    // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
    const accum = def( 'vec4' );
    upsampleTap9( ( weight, offset ) => {
      const tex = texture( sampler0, sub( uv, mul( deltaTexel, offset ) ) );
      addAssign( accum, mul( weight, tex ) );
    } );

    const col = sw( accum, 'rgb' );
    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
