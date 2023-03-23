import { SwizzleComponentVec4, add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, div, forLoop, fract, insert, length, main, max, mul, sin, sub, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { TAU } from '../../../utils/constants';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';

export const moonTexGenFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const frameCount = defUniformNamed( 'float', 'frameCount' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const { init, random4 } = glslDefRandom();

  main( () => {
    init( vec4( frameCount ) );

    assign( fragColor, texture( sampler0, vUv ) );

    const p = def( 'vec2', vUv );
    addAssign( p, mul( 0.02, sw( cyclicNoise(
      vec3( sin( mul( TAU, p ) ), frameCount )
    ), 'xy' ) ) );

    const dice = def( 'vec4' );

    const haha = ( size: number, comp: SwizzleComponentVec4 ): void => {
      assign( dice, random4() );
      assign( p, fract( add( p, sw( dice, 'xy' ) ) ) );

      const r = div( sw( dice, 'z' ), size );
      const d = sub( length( sub( p, 0.5 ) ), r );

      assign( sw( fragColor, comp ), max( sw( fragColor, comp ), mul( -size, d ) ) );
    };

    haha( 5.0, 'x' );
    forLoop( 16, () => haha( 15.0, 'y' ) );
    forLoop( 256, () => haha( 40.0, 'z' ) );
  } );
} );
