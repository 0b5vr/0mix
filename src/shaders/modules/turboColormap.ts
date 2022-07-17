/* !
 * Turbo Colormap
 * Copyright 2019 Google LLC.
 * Apache-2.0
 * https://gist.github.com/mikhailov-work/0d177465a8151eb6ede1768d51d476c7
 */

import { GLSLExpression, add, assign, cache, def, defFn, dot, mul, retFn, sq, sw, vec2, vec3, vec4 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

const K_R_VEC4 = vec4( 0.13572138, 4.61539260, -42.66032258, 132.13108234 );
const K_G_VEC4 = vec4( 0.09140261, 2.19418839, 4.84296658, -14.18503333 );
const K_B_VEC4 = vec4( 0.10667330, 12.64194608, -60.58204836, 110.36276771 );
const K_R_VEC2 = vec2( -152.94239396, 59.28637943 );
const K_G_VEC2 = vec2( 4.27729857, 2.82956604 );
const K_B_VEC2 = vec2( -89.90310912, 27.34824973 );

const symbol = Symbol();

export function turboColormap(
  x: GLSLExpression<'float'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec3',
      [ 'float' ],
      ( x ) => {
        assign( x, glslSaturate( x ) );
        const v4 = def( 'vec4', vec4( 1.0, x, sq( x ), mul( x, x, x ) ) );
        const v2 = def( 'vec2', mul( sw( v4, 'zw' ), sw( v4, 'z' ) ) );
        retFn( vec3(
          add( dot( v4, K_R_VEC4 ), dot( v2, K_R_VEC2 ) ),
          add( dot( v4, K_G_VEC4 ), dot( v2, K_G_VEC2 ) ),
          add( dot( v4, K_B_VEC4 ), dot( v2, K_B_VEC2 ) ),
        ) );
      }
    )
  );

  return f( x );
}
