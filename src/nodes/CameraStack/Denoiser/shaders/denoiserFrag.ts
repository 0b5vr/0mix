import { abs, add, addAssign, arrayIndex, assign, build, def, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, discard, div, dot, eq, exp, forLoop, ifThen, insert, int, length, mad, main, max, mul, neg, pow, sqrt, step, sub, sw, tern, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';
import { glslGaussian } from '../../../../shaders/modules/glslGaussian';

export const denoiserFrag = ( iter: number ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );

  /** vec3( rt, p, n ) */
  const sigma = defUniformNamed( 'vec3', 'sigma' );

  const sampler0 = defUniformArrayNamed( 'sampler2D', 'sampler0', 4 );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  main( () => {
    const ppTex = def( 'vec4', texture( arrayIndex( sampler0, int( 1 ) ), vUv ) );
    ifThen( eq( sw( ppTex, 'w' ), 1.0 ), () => discard() );

    const delta = def( 'vec2', div( 2 ** iter, resolution ) );

    const ci = def( 'vec3', sw( texture( sampler1, vUv ), 'xyz' ) );
    const rtp = sw( ci, 'x' );
    const pp = sw( ppTex, 'xyz' );
    const np = def( 'vec3', sw( texture( arrayIndex( sampler0, int( 2 ) ), vUv ), 'xyz' ) );
    const ci1 = def( 'vec4', vec4( 0.0 ) );

    forLoop( 9, ( i ) => {
      const uvq = mad( delta, sub( vec2( i + '%3' as any, i + '/3' as any ), 1.0 ), vUv );

      const ciq = def( 'vec3', sw( texture( sampler1, uvq ), 'xyz' ) );
      const rtq = sw( ciq, 'x' );
      const pqTex = texture( arrayIndex( sampler0, int( 1 ) ), uvq );
      const pq = sw( pqTex, 'xyz' );
      const nq = sw( texture( arrayIndex( sampler0, int( 2 ) ), uvq ), 'xyz' );

      const weight = mul(
        exp( neg( div(
          abs( sub( rtp, rtq ) ),
          mul( sw( sigma, 'x' ), sqrt( add( rtp, rtq, 0.001 ) ) ),
        ) ) ),
        step( sw( pqTex, 'w' ), 1.0 ),
        glslGaussian( length( sub( pp, pq ) ), sw( sigma, 'y' ) ),
        pow( max( 0.0, dot( np, nq ) ), sw( sigma, 'z' ) ),
      );

      addAssign( ci1, mul( weight, vec4( ciq, 1.0 ) ) );
    } );

    assign( fragColor, tern(
      eq( sw( ci1, 'w' ), 0.0 ),
      vec4( 0.0 ),
      div( ci1, sw( ci1, 'w' ) )
    ) );
  } );
} );
