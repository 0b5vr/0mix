import { GLSLExpression, cache, defFn, lt, retFn, sw, tern } from '../shaderBuilder';

const symbol = Symbol();

export function isectMin(
  a: GLSLExpression<'vec4'>,
  b: GLSLExpression<'vec4'>,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec4', 'vec4' ], ( a, b ) => {
    retFn( tern(
      lt( sw( a, 'w' ), sw( b, 'w' ) ),
      a,
      b,
    ) );
  } ) );

  return f( a, b );
}
