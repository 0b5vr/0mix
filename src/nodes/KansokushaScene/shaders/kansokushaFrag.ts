import { add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, div, floor, fract, insert, mad, main, mod, mul, mulAssign, step, sub, subAssign, sw, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const kansokushaFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const uv = def( 'vec2', vUv );
    subAssign( sw( uv, 'x' ), 0.5 );
    mulAssign( uv, vec2( div( sw( resolution, 'x' ), sw( resolution, 'y' ) ), 3.0 ) );
    const dir = sub( mod( floor( sw( uv, 'y' ) ), 2.0 ), 0.5 );
    addAssign( sw( uv, 'x' ), mul( 0.5, time, dir ) );

    const phase = def( 'float', time );
    addAssign( phase, mul( 0.14, dir, floor( add( sw( uv, 'x' ), 0.5 ) ) ) );
    addAssign( phase, mul( 0.21, floor( sw( uv, 'y' ) ) ) );


    assign( uv, fract( uv ) );

    const tex = def( 'vec4', texture( sampler0, uv ) );
    const shape = mad( sw( tex, 'y' ), sw( tex, 'x' ), step( fract( phase ), 0.07 ) );
    assign( fragColor, vec4( shape ) );
  } );
} );
