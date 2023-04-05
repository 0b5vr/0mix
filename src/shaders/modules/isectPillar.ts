import { FAR } from '../../config';
import { GLSLExpression, GLSLFloatExpression, abs, add, and, assign, cache, def, defFn, div, dot, gte, ifThen, lt, mad, mul, neg, num, retFn, sign, sq, sqrt, sub, sw, vec3, vec4 } from '../shaderBuilder';

/*!
 * The cylinder intersection is taken from iq's shadertoy
 * (c) 2016 Inigo Quilez, MIT License
 *
 * https://www.shadertoy.com/view/4lcSRn
 */

const symbol = Symbol();

export function isectPillar(
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  r: GLSLFloatExpression,
  len: GLSLFloatExpression,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn(
    'vec4',
    [ 'vec3', 'vec3', 'float', 'float' ],
    ( ro, rd, r, len ) => {
      const sqLenXY = sub( 1.0, sq( sw( rd, 'z' ) ) );

      const b = def( 'float', sub( dot( ro, rd ), mul( sw( ro, 'z' ), sw( rd, 'z' ) ) ) );
      const c = sub( dot( ro, ro ), sq( sw( ro, 'z' ) ), sq( r ) );
      const h = def( 'float', sub( sq( b ), mul( sqLenXY, c ) ) );

      ifThen( lt( h, 0.0 ), () => retFn( vec4( FAR ) ) );

      assign( h, sqrt( h ) );
      const d = def( 'float', div( neg( add( b, h ) ), sqLenXY ) );
      const rp = def( 'vec3', mad( d, rd, ro ) );
      ifThen( and( lt( abs( sw( rp, 'z' ) ), len ), gte( d, 0.0 ) ), () => {
        const N = div( mul( vec3( 1.0, 1.0, 0.0 ), rp ), r );
        retFn( vec4( N, d ) );
      } );

      const capDir = sign( sw( rp, 'z' ) );
      const dCap = def( 'float', div(
        sub( mul( capDir, len ), sw( ro, 'z' ) ),
        sw( rd, 'z' ),
      ) );
      ifThen( and( lt( abs( mad( sqLenXY, dCap, b ) ), h ), gte( dCap, 0.0 ) ), () => {
        const N = vec3( 0.0, 0.0, capDir );
        retFn( vec4( N, dCap ) );
      } );

      retFn( vec4( FAR ) );
    },
  ) );

  return f( ro, rd, num( r ), num( len ) );
}
