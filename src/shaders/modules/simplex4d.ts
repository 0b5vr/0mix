/*!
 * Original implementation by Ashima Arts (MIT License)
 * https://github.com/hughsk/glsl-noise
 */

import { GLSLExpression, abs, add, addAssign, assign, cache, def, defConst, defFn, dot, floor, fract, max, mul, mulAssign, retFn, sq, step, sub, sw, vec2, vec3, vec4 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';
import { mod289 } from './mod289';
import { permute } from './simplexPermute';
import { taylorInvSqrt } from './taylorInvSqrt';

const symbolPermute1 = Symbol();

function permute1( x: GLSLExpression<'float'> ): GLSLExpression<'float'> {
  const f = cache(
    symbolPermute1,
    () => defFn( 'float', [ 'float' ], ( x ) => retFn( permute( x ) ) ),
  );

  return f( x );
}

const symbolPermute4 = Symbol();

function permute4( x: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'> {
  const f = cache(
    symbolPermute4,
    () => defFn( 'vec4', [ 'vec4' ], ( x ) => retFn( permute( x ) ) ),
  );

  return f( x );
}

const symbolGrad4 = Symbol();

function grad4(
  j: GLSLExpression<'float'>,
  ip: GLSLExpression<'vec4'>,
): GLSLExpression<'vec4'> {
  const f = cache(
    symbolGrad4,
    () => defFn( 'vec4', [ 'float', 'vec4' ], ( j, ip ) => {
      const p = def( 'vec4', vec4( 0.0 ) );
      const s = def( 'vec4', vec4( 0.0 ) );

      assign( sw( p, 'xyz' ), sub( mul( floor(
        mul( fract( mul( vec3( j ), sw( ip, 'xyz' ) ) ), 7.0 )
      ), sw( ip, 'z' ) ), 1.0 ) );
      assign( sw( p, 'w' ), sub( 1.5, dot( abs( sw( p, 'xyz' ) ), vec3( 1.0 ) ) ) );
      assign( s, step( p, vec4( 0.0 ) ) );
      addAssign( sw( p, 'xyz' ), mul( sub( mul( sw( s, 'xyz' ), 2.0 ), 1.0 ), sw( s, 'www' ) ) );

      retFn( p );
    } )
  );

  return f( j, ip );
}

const symbol = Symbol();

export function simplex4d( v: GLSLExpression<'vec4'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec4' ], ( v ) => {
    // (sqrt(5) - 1)/4 = F4, used once below
    const F4 = 0.309016994374947451;

    const C = defConst( 'vec4', vec4(
      0.138196601125011,   // (5 - sqrt(5))/20  G4
      0.276393202250021,   // 2 * G4
      0.414589803375032,   // 3 * G4
      -0.447213595499958   // -1 + 4 * G4
    ) );

    // First corner
    const i = def( 'vec4', floor( add( v, dot( v, vec4( F4 ) ) ) ) );
    const x0 = def( 'vec4', sub( v, sub( i, dot( i, sw( C, 'xxxx' ) ) ) ) );

    // Other corners

    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    const isX = def( 'vec3', step( sw( x0, 'yzw' ), sw( x0, 'xxx' ) ) );
    const isYZ = def( 'vec3', step( sw( x0, 'zww' ), sw( x0, 'yyz' ) ) );
    const i0 = def( 'vec4', vec4(
      dot( isX, vec3( 1.0 ) ),
      sub( 1.0, isX ),
    ) );
    addAssign( i0, vec4(
      0.0,
      dot( sw( isYZ, 'xy' ), vec2( 1.0 ) ),
      sub( 1.0, sw( isYZ, 'xy' ) )
    ) );
    addAssign( i0, vec4(
      0.0,
      0.0,
      sw( isYZ, 'z' ),
      sub( 1.0, sw( isYZ, 'z' ) ),
    ) );

    // i0 now contains the unique values 0,1,2,3 in each channel
    const i3 = def( 'vec4', glslSaturate( i0 ) );
    const i2 = def( 'vec4', glslSaturate( sub( i0, 1.0 ) ) );
    const i1 = def( 'vec4', glslSaturate( sub( i0, 2.0 ) ) );

    const x1 = def( 'vec4', sub( x0, sub( i1, sw( C, 'xxxx' ) ) ) );
    const x2 = def( 'vec4', sub( x0, sub( i2, sw( C, 'yyyy' ) ) ) );
    const x3 = def( 'vec4', sub( x0, sub( i3, sw( C, 'zzzz' ) ) ) );
    const x4 = def( 'vec4', add( x0, sw( C, 'wwww' ) ) );

    // Permutations
    assign( i, mod289( i ) );
    const j0 = def( 'float', permute1(
      add( permute1(
        add( permute1(
          add( permute1(
            sw( i, 'w' )
          ), sw( i, 'z' ) )
        ), sw( i, 'y' ) )
      ), sw( i, 'x' ) ) )
    );
    const j1 = def( 'vec4', permute4(
      add( permute4(
        add( permute4(
          add( permute4(
            add( sw( i, 'w' ), vec4( sw( i1, 'w' ), sw( i2, 'w' ), sw( i3, 'w' ), 1.0 ) )
          ), sw( i, 'z' ), vec4( sw( i1, 'z' ), sw( i2, 'z' ), sw( i3, 'z' ), 1.0 ) )
        ), sw( i, 'y' ), vec4( sw( i1, 'y' ), sw( i2, 'y' ), sw( i3, 'y' ), 1.0 ) )
      ), sw( i, 'x' ), vec4( sw( i1, 'x' ), sw( i2, 'x' ), sw( i3, 'x' ), 1.0 ) )
    ) );

    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.
    const ip = defConst( 'vec4', vec4( 1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0 ) );

    const p0 = def( 'vec4', grad4( j0, ip ) );
    const p1 = def( 'vec4', grad4( sw( j1, 'x' ), ip ) );
    const p2 = def( 'vec4', grad4( sw( j1, 'y' ), ip ) );
    const p3 = def( 'vec4', grad4( sw( j1, 'z' ), ip ) );
    const p4 = def( 'vec4', grad4( sw( j1, 'w' ), ip ) );

    // Normalise gradients
    const norm = def( 'vec4', taylorInvSqrt(
      vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) )
    ) );
    mulAssign( p0, sw( norm, 'x' ) );
    mulAssign( p1, sw( norm, 'y' ) );
    mulAssign( p2, sw( norm, 'z' ) );
    mulAssign( p3, sw( norm, 'w' ) );
    mulAssign( p4, taylorInvSqrt( dot( p4, p4 ) ) );

    // Mix contributions from the five corners
    const m0 = def( 'vec3', (
      max( sub( 0.6, vec3( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ) ) ), 0.0 )
    ) );
    const m1 = def( 'vec2', (
      max( sub( 0.6, vec2( dot( x3, x3 ), dot( x4, x4 ) ) ), 0.0 )
    ) );
    mulAssign( m0, m0 );
    mulAssign( m1, m1 );

    retFn( mul( 49.0, (
      add(
        dot( sq( m0 ), vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ) ) ),
        dot( sq( m1 ), vec2( dot( p3, x3 ), dot( p4, x4 ) ) ),
      )
    ) ) );
  } ) );

  return f( v );
}
