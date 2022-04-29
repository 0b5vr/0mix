import { GLSLExpression, GLSLFloatExpression, abs, cache, defFn, div, dot, num, pow, retFn, vec3 } from '../shaderBuilder';

const symbol = Symbol();

export function minkowski3d(
  v: GLSLExpression<'vec3'>,
  p: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'float' ], ( v, p ) => {
    retFn( pow(
      dot( pow( abs( v ), vec3( p ) ), vec3( 1.0 ) ),
      div( 1.0, p )
    ) );
  } ) );

  return f( v, num( p ) );
}
