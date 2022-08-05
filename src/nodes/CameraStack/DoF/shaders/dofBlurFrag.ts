import { GOLDEN_ANGLE } from '../../../../utils/constants';
import { add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, div, divAssign, float, forBreak, forLoop, glFragCoord, ifThen, insert, int, ivec2, lt, main, mix, mul, sin, sqrt, step, sub, sw, texelFetch, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { glslLinearstep } from '../../../../shaders/modules/glslLinearstep';
import { glslSaturate } from '../../../../shaders/modules/glslSaturate';

export const dofBlurFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerTile = defUniformNamed( 'sampler2D', 'samplerTile' );
  const samplerPresort = defUniformNamed( 'sampler2D', 'samplerPresort' );

  main( () => {
    const kernelScale = def( 'float', div( sw( resolution, 'y' ), 1080.0 ) );
    const cocMax = def( 'float', add( 1.0, sw( texture( samplerTile, vUv ), 'y' ) ) );

    const bg = def( 'vec4', vec4( 0.0 ) );
    const fg = def( 'vec4', vec4( 0.0 ) );

    forLoop( 64, ( i ) => {
      const r = def( 'float', sqrt( float( i ) ) );
      ifThen( lt( cocMax, r ), () => forBreak() );

      const p = mul( GOLDEN_ANGLE, float( i ) );
      const coord = def( 'ivec2', ivec2( add(
        sw( glFragCoord, 'xy' ),
        mul( kernelScale, r, vec2( cos( p ), sin( p ) ) ),
      ) ) );

      const texPresort = def( 'vec4', texelFetch( samplerPresort, coord, int( 0 ) ) );
      const coc = sw( texPresort, 'x' );

      const weight = glslSaturate( sub( coc, r, -1.0 ) );

      const tex0 = def( 'vec4', texelFetch( sampler0, coord, int( 0 ) ) );
      assign( sw( tex0, 'w' ), 1.0 );

      addAssign( bg, mul( sw( texPresort, 'y' ), weight, tex0 ) );
      addAssign( fg, mul( sw( texPresort, 'z' ), weight, tex0 ) );
    } );

    divAssign( sw( bg, 'xyz' ), mix( 1.0, sw( bg, 'w' ), step( 1E-6, sw( bg, 'w' ) ) ) ); // just `bg /= bg.w` but with zerodiv guard
    divAssign( sw( fg, 'xyz' ), mix( 1.0, sw( fg, 'w' ), step( 1E-6, sw( fg, 'w' ) ) ) ); // just `fg /= fg.w` but with zerodiv guard

    const fga = glslLinearstep(
      0.0,
      0.9,
      div( sw( fg, 'a' ), add( sw( bg, 'a' ), sw( fg, 'a' ) ) ),
    );
    assign( fragColor, mix( bg, fg, fga ) );
    // assign( fragColor, fg );
    // assign( fragColor, bg );
    // assign( fragColor, vec4( fga ) );
    // assign( fragColor, texture( sampler0, vUv ) );
  } );
} );
