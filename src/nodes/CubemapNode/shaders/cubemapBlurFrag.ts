import { addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, div, float, floor, forLoop, fract, gt, ifThen, insert, log2, main, min, mul, mulAssign, neg, pow, sub, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cubemapUVInv } from '../../../shaders/modules/cubemapUVInv';
import { cubemapUVMip } from '../../../shaders/modules/cubemapUVMip';
import { glslGaussian } from '../../../shaders/modules/glslGaussian';
import { orthBas } from '../../../shaders/modules/orthBas';
import { rotate2D } from '../../../shaders/modules/rotate2D';

const SAMPLES = 9;

export const cubemapBlurFrag = ( dir: 0 | 1 ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );
  const samplerCubemap = defUniformNamed( 'sampler2D', 'samplerCubemap' );

  main( () => {
    const lv = def( 'float', floor( neg( log2( sub( 1.0, sw( vUv, 'y' ) ) ) ) ) );
    addAssign( lv, 1.0 );
    assign( lv, min( lv, 6.0 ) );

    const p = pow( 2.0, min( lv, 5.0 ) );

    ifThen( gt( mul( p, sw( vUv, 'x' ) ), 1.0 ), () => discard() );

    const uv = fract( mul( p, vUv ) );

    const N = def( 'vec3', cubemapUVInv( uv ) );
    const b = orthBas( N );

    const accum = def( 'vec4', vec4( 0.0 ) );

    forLoop( SAMPLES, ( i ) => {
      const L = def( 'vec3', vec3( 0, 0, 1 ) );
      const x = def( 'float', sub( float( i ), ( SAMPLES - 1 ) / 2 ) );
      const theta = mul( 0.01, x, p ); // cringe
      if ( dir ) { // v
        mulAssign( sw( L, 'zx' ), rotate2D( theta ) );
      } else { // h
        mulAssign( sw( L, 'yz' ), rotate2D( theta ) );
      }
      assign( L, mul( b, L ) );

      addAssign( accum, mul(
        texture( samplerCubemap, cubemapUVMip( L, lv ) ),
        glslGaussian( x, 2.0 ),
      ) );
    } );

    const accumw = sw( accum, 'w' );
    assign( accum, div( accum, accumw ) );

    assign( fragColor, accum );
  } );
} );
