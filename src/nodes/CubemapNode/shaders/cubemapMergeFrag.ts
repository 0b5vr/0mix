import { add, addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, div, floor, forBreak, forLoop, gt, ifThen, insert, log2, main, min, mul, neg, pow, sub, sw, tern, texture, vec4 } from '../../../shaders/shaderBuilder';

export const cubemapMergeFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );
  const samplerCubemap = defUniformNamed( 'sampler2D', 'samplerCubemap' );

  main( () => {
    const lv = def( 'float', floor( neg( log2( sub( 1.0, sw( vUv, 'y' ) ) ) ) ) );
    addAssign( lv, 1.0 );
    assign( lv, min( lv, 5.0 ) );

    const p = pow( 2.0, lv );
    const pInv = div( 1.0, p );

    const uv = def( 'vec2', vUv );
    const uvx = sw( uv, 'x' );

    ifThen( gt( mul( p, uvx ), 1.0 ), () => discard() );

    const accum = def( 'vec4', texture( samplerCubemap, uv ) );

    forLoop( 31, () => {
      add( uvx, pInv );
      ifThen( gt( uvx, 1.0 ), () => forBreak() );
      addAssign( accum, texture( samplerCubemap, uv ) );
    } );

    const accumw = sw( accum, 'w' );
    assign( accum, tern(
      gt( accumw, 0.001 ),
      div( accum, accumw ),
      vec4( 0.0, 0.0, 0.0, 1.0 ),
    ) );

    assign( fragColor, accum );
  } );
} );
