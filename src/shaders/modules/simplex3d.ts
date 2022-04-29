/*!
 * Original implementation by Ashima Arts (MIT License)
 * https://github.com/hughsk/glsl-noise
 */

import { GLSLExpression, abs, add, assign, cache, def, defConst, defFn, dot, floor, max, min, mix, mul, mulAssign, neg, retFn, sq, step, sub, sw, vec2, vec3, vec4 } from '../shaderBuilder';
import { mod289 } from './mod289';
import { permute } from './simplexPermute';
import { taylorInvSqrt } from './taylorInvSqrt';

const symbolPermute4 = Symbol();

function permute4( x: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'> {
  const f = cache(
    symbolPermute4,
    () => defFn( 'vec4', [ 'vec4' ], ( x ) => retFn( permute( x ) ) ),
  );

  return f( x );
}


const symbol = Symbol();

export function simplex3d( v: GLSLExpression<'vec3'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3' ], ( v ) => {
    const C = defConst( 'vec2', vec2( 1.0 / 6.0, 1.0 / 3.0 ) );
    const D = defConst( 'vec4', vec4( 0.0, 0.5, 1.0, 2.0 ) );

    // First corner
    const i = def( 'vec3', floor( add( v, dot( v, sw( C, 'yyy' ) ) ) ) );
    const x0 = def( 'vec3', sub( v, sub( i, dot( i, sw( C, 'xxx' ) ) ) ) );

    // Other corners
    const g = def( 'vec3', step( sw( x0, 'yzx' ), sw( x0, 'xyz' ) ) );
    const l = def( 'vec3', sub( 1.0, g ) );
    const i1 = min( g, sw( l, 'zxy' ) );
    const i2 = max( g, sw( l, 'zxy' ) );

    const x1 = def( 'vec3', sub( x0, sub( i1, sw( C, 'xxx' ) ) ) );
    const x2 = def( 'vec3', sub( x0, sub( i2, sw( C, 'yyy' ) ) ) );
    const x3 = def( 'vec3', sub( x0, sw( D, 'yyy' ) ) );

    // Permutations
    assign( i, mod289( i ) );
    const p = def( 'vec4', permute4(
      add( permute4(
        add( permute4(
          add( sw( i, 'z' ), vec4( 0.0, sw( i1, 'z' ), sw( i2, 'z' ), 1.0 ) )
        ), sw( i, 'y' ), vec4( 0.0, sw( i1, 'y' ), sw( i2, 'y' ), 1.0 ) )
      ), sw( i, 'x' ), vec4( 0.0, sw( i1, 'x' ), sw( i2, 'x' ), 1.0 ) ) )
    );

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    const ns = sub( mul( 1.0 / 7.0, sw( D, 'wyz' ) ), sw( D, 'xzx' ) );

    const j = sub( p, mul( 49.0, floor( mul( p, sw( ns, 'z' ), sw( ns, 'z' ) ) ) ) );

    const x_ = floor( mul( j, sw( ns, 'z' ) ) );
    const y_ = floor( sub( j, mul( 7.0, x_ ) ) );

    const x = def( 'vec4', add( mul( x_, sw( ns, 'x' ) ), sw( ns, 'yyyy' ) ) );
    const y = def( 'vec4', add( mul( y_, sw( ns, 'x' ) ), sw( ns, 'yyyy' ) ) );
    const h = sub( 1.0, abs( x ), abs( y ) );

    const b0 = def( 'vec4', vec4( sw( x, 'xy' ), sw( y, 'xy' ) ) );
    const b1 = def( 'vec4', vec4( sw( x, 'zw' ), sw( y, 'zw' ) ) );

    const s0 = mix( vec4( 1.0 ), vec4( 3.0 ), floor( b0 ) );
    const s1 = mix( vec4( 1.0 ), vec4( 3.0 ), floor( b1 ) );
    const sh = neg( step( h, vec4( 0.0 ) ) );

    const a0 = def( 'vec4', add( sw( b0, 'xzyw' ), mul( sw( s0, 'xzyw' ), sw( sh, 'xxyy' ) ) ) );
    const a1 = def( 'vec4', add( sw( b1, 'xzyw' ), mul( sw( s1, 'xzyw' ), sw( sh, 'zzww' ) ) ) );

    const p0 = def( 'vec3', vec3( sw( a0, 'xy' ), sw( h, 'x' ) ) );
    const p1 = def( 'vec3', vec3( sw( a0, 'zw' ), sw( h, 'y' ) ) );
    const p2 = def( 'vec3', vec3( sw( a1, 'xy' ), sw( h, 'z' ) ) );
    const p3 = def( 'vec3', vec3( sw( a1, 'zw' ), sw( h, 'w' ) ) );

    // Normalise gradients
    const norm = def( 'vec4', taylorInvSqrt(
      vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) )
    ) );
    mulAssign( p0, sw( norm, 'x' ) );
    mulAssign( p1, sw( norm, 'y' ) );
    mulAssign( p2, sw( norm, 'z' ) );
    mulAssign( p3, sw( norm, 'w' ) );

    // Mix contributions from the five corners
    const m = def( 'vec4', (
      max( sub( 0.6, vec4( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ), dot( x3, x3 ) ) ), 0.0 )
    ) );
    mulAssign( m, m );

    retFn( mul( 42.0, (
      dot( sq( m ), vec4( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ), dot( p3, x3 ) ) )
    ) ) );
  } ) );

  return f( v );
}
