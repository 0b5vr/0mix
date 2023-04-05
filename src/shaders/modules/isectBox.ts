import { FAR } from '../../config';
import { GLSLExpression, abs, add, cache, def, defFn, div, ifThen, lt, max, min, mul, neg, or, retFn, sign, step, sub, sw, vec3, vec4 } from '../shaderBuilder';

const symbol = Symbol();

export function isectBox(
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  s: GLSLExpression<'vec3'>,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec3', 'vec3', 'vec3' ], ( ro, rd, s ) => {
    const src = neg( div( ro, rd ) );
    const dst = abs( div( s, rd ) );
    const f = def( 'vec3', sub( src, dst ) );
    const b = def( 'vec3', add( src, dst ) );
    const fl = def( 'float', max( sw( f, 'x' ), max( sw( f, 'y' ), sw( f, 'z' ) ) ) );
    const bl = min( sw( b, 'x' ), min( sw( b, 'y' ), sw( b, 'z' ) ) );
    ifThen( or( lt( bl, fl ), lt( fl, 0.0 ) ), () => retFn( vec4( FAR ) ) );
    const n = mul(
      -1.0,
      sign( rd ),
      step( vec3( fl ), f ),
    );
    retFn( vec4( n, fl ) );
  } ) );

  return f( ro, rd, s );
}
