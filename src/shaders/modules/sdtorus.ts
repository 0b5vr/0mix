import { GLSLExpression, GLSLFloatExpression, cache, defFn, length, num, retFn, sub, sw, vec2 } from '../shaderBuilder';

const symbol = Symbol();

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function sdtorus(
  p: GLSLExpression<'vec3'>,
  R: GLSLFloatExpression,
  r: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'float', 'float' ], ( p, R, r ) => {
    const v = vec2( sub( length( sw( p, 'xy' ) ), R ), sw( p, 'z' ) );
    retFn( sub( length( v ), r ) );
  } ) );

  return f( p, num( R ), num( r ) );
}
