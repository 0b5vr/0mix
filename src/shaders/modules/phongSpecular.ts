import { GLSLExpression, GLSLFloatExpression, cache, defFn, dot, max, normalize, num, pow, retFn } from '../shaderBuilder';

const symbol = Symbol();

export function phongSpecular(
  v: GLSLExpression<'vec3'>,
  dir: GLSLExpression<'vec3'>,
  p: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'vec3', 'float' ], ( v, dir, p ) => {
    const d = max( 0.0, dot( v, normalize( dir ) ) );
    retFn( pow( d, p ) );
  } ) );

  return f( v, dir, num( p ) );
}
