import { assign, build, defInNamed, defOut, defUniformNamed, insert, main, texture } from '../shaderBuilder';

export const textureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    assign( fragColor, texture( sampler0, vUv ) );
  } );
} );
