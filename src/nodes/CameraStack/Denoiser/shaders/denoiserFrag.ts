import { abs, add, addAssign, arrayIndex, assign, build, def, defConstArray, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, eq, exp, forLoop, insert, int, length, mad, main, max, mul, neg, pow, sqrt, step, sub, sw, tern, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { glslGaussian } from '../../../../shaders/modules/glslGaussian';

const SIGMA_RT = 0.5;
const SIGMA_P = 0.5;
const SIGMA_N = 0.5;

export const denoiserFrag = ( iter: number ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformArrayNamed( 'sampler2D', 'sampler0', 4 );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  const hTable = defConstArray( 'float', [ 0.25, 1.0, 1.5, 1.0, 0.25 ] );

  main( () => {
    const delta = def( 'vec2', div( 2 ** iter, resolution ) );

    const ci = def( 'vec3', sw( texture( sampler1, vUv ), 'xyz' ) );
    const rtp = sw( ci, 'x' );
    const pp = def( 'vec3', sw( texture( arrayIndex( sampler0, int( 1 ) ), vUv ), 'xyz' ) );
    const np = def( 'vec3', sw( texture( arrayIndex( sampler0, int( 2 ) ), vUv ), 'xyz' ) );
    const ci1 = def( 'vec4', vec4( 0.0 ) );

    forLoop( 5, ( iy ) => {
      const hy = arrayIndex( hTable, iy );
      forLoop( 5, ( ix ) => {
        const h = mul( hy, arrayIndex( hTable, ix ) );

        const uvq = mad( vUv, delta, sub( vec2( ix, iy ), 2.0 ) );

        const ciq = def( 'vec3', sw( texture( sampler1, uvq ), 'xyz' ) );
        const rtq = sw( ciq, 'x' );
        const pqTex = texture( arrayIndex( sampler0, int( 1 ) ), uvq );
        const pq = sw( pqTex, 'xyz' );
        const nq = sw( texture( arrayIndex( sampler0, int( 2 ) ), uvq ), 'xyz' );

        const weight = mul(
          exp( neg( div(
            abs( sub( rtp, rtq ) ),
            mul( SIGMA_RT, sqrt( add( rtp, rtq, 0.001 ) ) ),
          ) ) ),
          step( sw( pqTex, 'w' ), 1.0 ),
          glslGaussian( length( sub( pp, pq ) ), SIGMA_P ),
          pow( max( 0.0, dot( np, nq ) ), SIGMA_N ),
        );

        addAssign( ci1, mul(
          h,
          weight,
          vec4( ciq, 1.0 ),
        ) );
      } );
    } );

    assign( fragColor, tern(
      eq( sw( ci1, 'w' ), 0.0 ),
      vec4( 0.0 ),
      div( ci1, sw( ci1, 'w' ) )
    ) );
  } );
} );
