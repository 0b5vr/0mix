import { FAR } from '../../config';
import { GLSLExpression, abs, add, cache, def, defFn, div, ifThen, lt, min, mul, neg, retFn, sign, step, sw, vec4 } from '../shaderBuilder';

const symbol = Symbol();

export function isectInBox(
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  s: GLSLExpression<'vec3'>,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec3', 'vec3', 'vec3' ], ( ro, rd, s ) => {
    const src = neg( div( ro, rd ) );
    const dst = abs( div( s, rd ) );
    const b = def( 'vec3', add( src, dst ) );
    const bl = min( sw( b, 'x' ), min( sw( b, 'y' ), sw( b, 'z' ) ) );
    ifThen( lt( bl, 1E-3 ), () => retFn( vec4( FAR ) ) );
    const n = mul(
      -1.0,
      sign( rd ),
      step( b, sw( b, 'yzx' ) ),
      step( b, sw( b, 'zxy' ) ),
    );
    retFn( vec4( n, bl ) );
  } ) );

  return f( ro, rd, s );
}
