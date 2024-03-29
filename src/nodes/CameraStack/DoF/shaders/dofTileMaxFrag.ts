import { add, assign, build, def, defInNamed, defOut, defUniformNamed, div, float, forLoop, insert, main, max, min, mul, neg, sub, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { dofCalcCoC } from './dofCalcCoC';
import { invCalcDepth } from '../../../../shaders/modules/invCalcDepth';

export const dofTileMaxFrag = ( isVert: boolean ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const offset = def( 'vec2', div(
      isVert ? vec2( 0.0, 1.0 / 16.0 ) : vec2( 1.0 / 16.0, 0.0 ),
      resolution,
    ) );

    const depthNearest = def( 'float', 1E9 );
    const cocMax = def( 'float', 0.0 );

    forLoop( 8, ( i ) => {
      const uv = add(
        vUv,
        mul( offset, sub( float( i ), 3.5 ) ),
      );

      const tex = def( 'vec4', texture( sampler0, uv ) );
      const depth = isVert
        ? sw( tex, 'x' )
        : def( 'float', neg( invCalcDepth( sw( tex, 'w' ) ) ) );
      assign( depthNearest, min( depthNearest, depth ) );

      const coc = isVert
        ? sw( tex, 'y' )
        : dofCalcCoC( depth );
      assign( cocMax, max( cocMax, coc ) );
    } );

    assign( fragColor, vec4( depthNearest, cocMax, 0.0, 0.0 ) );
  } );
} );
