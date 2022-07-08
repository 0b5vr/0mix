import { glslLinearstep } from '../../../../shaders/modules/glslLinearstep';
import { glslSaturate } from '../../../../shaders/modules/glslSaturate';
import { add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, div, divAssign, float, forBreak, forLoop, ifThen, insert, lt, main, mix, mul, sin, sqrt, step, sub, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { GOLDEN_ANGLE } from '../../../../utils/constants';

export const dofBlurFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerTile = defUniformNamed( 'sampler2D', 'samplerTile' );
  const samplerPresort = defUniformNamed( 'sampler2D', 'samplerPresort' );

  main( () => {
    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    const kernelScale = def( 'vec2', mul( 0.002, vec2( 1.0, aspect ) ) );

    const cocMax = def( 'float', sw( texture( samplerTile, vUv ), 'y' ) );

    const bg = def( 'vec4', vec4( 0.0 ) );
    const fg = def( 'vec4', vec4( 0.0 ) );

    forLoop( 64, ( i ) => {
      const r = mul( sqrt( float( i ) ), cocMax, 0.1 );
      ifThen( lt( cocMax, r ), () => forBreak() );

      const p = mul( GOLDEN_ANGLE, float( i ) );
      const offset = mul( kernelScale, r, vec2( cos( p ), sin( p ) ) );
      const uv = def( 'vec2', add( vUv, offset ) );

      const texPresort = def( 'vec4', texture( samplerPresort, uv ) );
      const coc = sw( texPresort, 'x' );

      const weight = glslSaturate( sub( coc, r, -1.0 ) );

      const tex0 = def( 'vec4', vec4( sw( texture( sampler0, uv ), 'xyz' ), 1.0 ) );

      addAssign( bg, mul( sw( texPresort, 'y' ), weight, tex0 ) );
      addAssign( fg, mul( sw( texPresort, 'z' ), weight, tex0 ) );
    } );

    divAssign( sw( bg, 'xyz' ), mix( 1.0, sw( bg, 'w' ), step( 1E-6, sw( bg, 'w' ) ) ) ); // just `bg /= bg.w` but with zerodiv guard
    divAssign( sw( fg, 'xyz' ), mix( 1.0, sw( fg, 'w' ), step( 1E-6, sw( fg, 'w' ) ) ) ); // just `fg /= fg.w` but with zerodiv guard

    const fga = glslLinearstep( 0.0, 0.5, sw( fg, 'a' ) );
    assign( fragColor, mix( bg, fg, fga ) );
    // assign( fragColor, fg );
    // assign( fragColor, bg );
    // assign( fragColor, vec4( fga ) );
    // assign( fragColor, texture( sampler0, vUv ) );
  } );
} );
