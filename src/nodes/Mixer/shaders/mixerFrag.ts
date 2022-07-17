import { addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, insert, main, mix, mul, texture } from '../../../shaders/shaderBuilder';

export const mixerFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );
  const blendAdd = defUniformNamed( 'float', 'blendAdd' );
  const blendMix = defUniformNamed( 'float', 'blendMix' );

  main( () => {
    const a = def( 'vec4', texture( sampler0, vUv ) );
    const b = def( 'vec4', texture( sampler1, vUv ) );

    assign( fragColor, mix( a, b, blendMix ) );
    addAssign( fragColor, mul( b, blendAdd ) );
  } );
} );
