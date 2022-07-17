/* !
 * Original implementation by Ashima Arts (MIT License)
 * https://github.com/hughsk/glsl-noise
 */

import { GLSLExpression, abs, add, assign, cache, def, defConst, defFn, dot, floor, fract, gt, max, mul, mulAssign, retFn, sq, sub, subAssign, sw, tern, vec2, vec3, vec4 } from '../shaderBuilder';
import { mod289 } from './mod289';
import { permute } from './simplexPermute';

const symbolPermute4 = Symbol();

function permute3( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache(
    symbolPermute4,
    () => defFn( 'vec3', [ 'vec3' ], ( x ) => retFn( permute( x ) ) ),
  );

  return f( x );
}

const symbol = Symbol();

export function simplex2d( v: GLSLExpression<'vec2'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec2' ], ( v ) => {
    const C = defConst( 'vec4', vec4(
      0.211324865405187,  // (3.0-sqrt(3.0))/6.0
      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
      -0.577350269189626, // -1.0 + 2.0 * C.x
      0.024390243902439,  // 1.0 / 41.0
    ) );

    // First corner
    const i = def( 'vec2', floor( add( v, dot( v, sw( C, 'yy' ) ) ) ) );
    const x0 = def( 'vec2', sub( v, sub( i, dot( i, sw( C, 'xx' ) ) ) ) );

    // Other corners
    const i1 = def( 'vec2', tern(
      gt( sw( x0, 'x' ), sw( x0, 'y' ) ),
      vec2( 1.0, 0.0 ),
      vec2( 0.0, 1.0 ),
    ) );
    const x12 = def( 'vec4', add( sw( x0, 'xyxy' ), sw( C, 'xxzz' ) ) );
    subAssign( sw( x12, 'xy' ), i1 );

    // Permutations
    assign( i, mod289( i ) );
    const p = def( 'vec3', permute3(
      add( permute3(
        add(
          sw( i, 'y' ),
          vec3( 0.0, sw( i1, 'y' ), 1.0 ),
        )
      ), sw( i, 'x' ), vec3( 0.0, sw( i1, 'x' ), 1.0 ) ) )
    );

    const m = def( 'vec3', max(
      sub(
        0.5,
        vec3(
          dot( x0, x0 ),
          dot( sw( x12, 'xy' ), sw( x12, 'xy' ) ),
          dot( sw( x12, 'zw' ), sw( x12, 'zw' ) ),
        )
      ),
      0.0,
    ) );
    mulAssign( m, m );
    mulAssign( m, m );

    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    const x = sub( mul( 2.0, fract( mul( p, sw( C, 'www' ) ) ) ), 1.0 );
    const h = sub( abs( x ), 0.5 );
    const ox = floor( add( x, 0.5 ) );
    const a0 = sub( x, ox );

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
    mulAssign( m, sub(
      1.79284291400159,
      mul( 0.85373472095314, add( sq( a0 ), sq( h ) ) ),
    ) );

    // Compute final noise value at P
    const g = vec3(
      add( mul( sw( a0, 'x' ), sw( x0, 'x' ) ), mul( sw( h, 'x' ), sw( x0, 'y' ) ) ),
      add( mul( sw( a0, 'yz' ), sw( x12, 'xz' ) ), mul( sw( h, 'yz' ), sw( x12, 'yw' ) ) ),
    );
    retFn( mul( 130.0, dot( m, g ) ) );
  } ) );

  return f( v );
}
