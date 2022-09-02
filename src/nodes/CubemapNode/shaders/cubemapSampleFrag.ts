import { PI } from '../../../utils/constants';
import { addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, dot, floor, forLoop, fract, glslFalse, glslTrue, gte, ifThen, insert, log2, main, max, mix, mul, mulAssign, neg, num, pow, reflect, sq, sub, sw, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { cubemapUV } from '../../../shaders/modules/cubemapUV';
import { cubemapUVInv } from '../../../shaders/modules/cubemapUVInv';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { sampleLambert } from '../../../shaders/modules/sampleLambert';

const SAMPLES = 64;

export const cubemapSampleFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const accumMix = defUniformNamed( 'float', 'accumMix' );
  const samplerPrev = defUniformNamed( 'sampler2D', 'samplerPrev' );
  const samplerCubemap = defUniformNamed( 'sampler2D', 'samplerCubemap' );

  const { init, random } = glslDefRandom();

  main( () => {
    init( vec4( vUv, time, 1.0 ) );

    const isDiffuse = def( 'bool', glslFalse );
    const lv = def( 'float', floor( neg( log2( sub( 1.0, sw( vUv, 'y' ) ) ) ) ) );
    addAssign( lv, 1.0 );
    ifThen( gte( lv, 6.0 ), () => {
      assign( isDiffuse, glslTrue );
      assign( lv, 5.0 );
    } );

    const p = pow( 2.0, lv );

    const roughnessSq = sq( mul( lv, 0.2 ) );

    const uv = fract( mul( p, vUv ) );

    const N = def( 'vec3', cubemapUVInv( uv ) );

    const accum = def( 'vec4', vec4( 0.0 ) );

    forLoop( SAMPLES, () => {
      const L = def( 'vec3' );
      ifThen( isDiffuse, () => {
        assign( L, sampleLambert( N ) );
      }, () => {
        const Xi = vec2( random(), random() );
        const H = sampleGGX( Xi, N, roughnessSq );
        assign( L, reflect( neg( N ), H ) );
      } );

      const dotNL = max( 0.0, dot( N, L ) );

      addAssign( accum, mul(
        dotNL,
        texture( samplerCubemap, cubemapUV( L, num( 255.0 / 256.0 ) ) ),
      ) );
    } );

    ifThen( isDiffuse, () => mulAssign( sw( accum, 'xyz' ), PI ) );

    assign( fragColor, mix(
      max( vec4( 0.0 ), texture( samplerPrev, vUv ) ),
      accum,
      accumMix,
    ) );
  } );
} );
