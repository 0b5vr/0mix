import { GLSLExpression, GLSLFloatExpression, cache, cos, def, defFn, mat2, neg, num, retFn, sin } from '../shaderBuilder';

const symbol = Symbol();

export function rotate2D(
  v: GLSLFloatExpression,
): GLSLExpression<'mat2'> {
  const f = cache( symbol, () => defFn( 'mat2', [ 'float' ], ( t ) => {
    const c = def( 'float', cos( t ) );
    const s = def( 'float', sin( t ) );
    retFn( mat2( c, s, neg( s ), c ) );
  } ) );

  return f( num( v ) );
}
