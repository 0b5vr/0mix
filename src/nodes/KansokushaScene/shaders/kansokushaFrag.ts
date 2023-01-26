import { addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, floor, fract, insert, mad, main, mod, mul, mulAssign, step, sub, subAssign, sw, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const kansokushaFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const uv = def( 'vec2', vUv );
    mulAssign( uv, vec2( aspect, 3.0 ) );
    subAssign( sw( uv, 'x' ), 0.5 );

    // scroll
    const dir = sub( mod( floor( sw( uv, 'y' ) ), 2.0 ), 0.5 );
    addAssign( sw( uv, 'x' ), mul( 0.5, time, dir ) );

    // flash
    const phase = def( 'float', time );
    addAssign( phase, mul( 0.14, dir, floor( sw( uv, 'x' ) ) ) );
    addAssign( phase, mul( 0.21, floor( sw( uv, 'y' ) ) ) );

    assign( uv, fract( uv ) );

    const tex = def( 'vec4', texture( sampler0, uv ) );
    const shape = mad( sw( tex, 'y' ), sw( tex, 'x' ), step( fract( phase ), 0.07 ) );
    assign( fragColor, vec4( shape ) );
  } );
} );
