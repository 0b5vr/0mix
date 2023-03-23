import { addAssign, build, def, defInNamed, defOut, defUniformNamed, insert, main, mul, pow, sin, subAssign, sw, texture } from '../../../shaders/shaderBuilder';

export const moonTexModFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const height = sw( fragColor, 'x' );

    const tex = def( 'vec4', texture( sampler0, vUv ) );

    addAssign( height, mul( 0.6, pow( sin( mul( 3.0, sw( tex, 'x' ) ) ), 20.0 ) ) );
    addAssign( height, mul( 0.3, pow( sin( mul( 2.4, sw( tex, 'y' ) ) ), 10.0 ) ) );
    subAssign( height, mul( 0.1, sw( tex, 'z' ) ) );
  } );
} );
