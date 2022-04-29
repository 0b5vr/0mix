import { GLSLExpression, GLSLFloatExpression, abs, cache, defFn, div, dot, num, pow, retFn, vec2 } from '../shaderBuilder';

const symbol = Symbol();

export function minkowski2d(
  v: GLSLExpression<'vec2'>,
  p: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec2', 'float' ], ( v, p ) => {
    retFn( pow(
      dot( pow( abs( v ), vec2( p ) ), vec2( 1.0 ) ),
      div( 1.0, p )
    ) );
  } ) );

  return f( v, num( p ) );
}
