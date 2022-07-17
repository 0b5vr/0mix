import { assign, build, def, defInNamed, defOut, defUniformNamed, div, insert, main, min, mul, neg, smoothstep, sq, sub, sw, texture, vec4 } from '../../../../shaders/shaderBuilder';
import { dofCalcCoC } from './dofCalcCoC';
import { invCalcDepth } from '../../../../shaders/modules/invCalcDepth';

export const dofPresortFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerTile = defUniformNamed( 'sampler2D', 'samplerTile' );

  main( () => {
    const tex0 = def( 'vec4', texture( sampler0, vUv ) );
    const texTile = def( 'vec4', texture( samplerTile, vUv ) );
    const depth = def( 'float', neg( invCalcDepth( sw( tex0, 'w' ), cameraNearFar ) ) );

    const coc = def( 'float', dofCalcCoC( depth ) );

    const alpha = min( div( 1.0, sq( coc ) ), 1.0 );

    const bg = def( 'float', smoothstep( 0.0, 5.0, sub( depth, sw( texTile, 'x' ) ) ) );

    assign( fragColor, vec4(
      coc,
      mul( alpha, bg ), // bg
      mul( alpha, sub( 1.0, bg ) ), // fg
      1.0,
    ) );
  } );
} );
