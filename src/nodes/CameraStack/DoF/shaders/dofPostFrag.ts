import { abs, add, addAssign, assign, band, build, def, defInNamed, defOut, defUniformNamed, div, float, forLoop, insert, int, main, mix, rshift, sub, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { glslSaturate } from '../../../../shaders/modules/glslSaturate';

export const dofPostFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );
  const samplerPresort = defUniformNamed( 'sampler2D', 'samplerPresort' );

  main( () => {
    const wetSum = def( 'vec4', vec4( 0.0 ) );

    forLoop( 4, ( i ) => {
      const off = div(
        sub( vec2(
          float( band( i, int( 1 ) ) ),
          float( rshift( i, int( 1 ) ) ),
        ), 0.5 ),
        resolution,
      );
      addAssign( wetSum, texture( sampler1, add( off, vUv ) ) );
    } );

    assign( fragColor, mix(
      texture( sampler0, vUv ),
      div( wetSum, 4.0 ),
      glslSaturate( abs( sw( texture( samplerPresort, vUv ), 'x' ) ) ),
    ) );
  } );
} );
