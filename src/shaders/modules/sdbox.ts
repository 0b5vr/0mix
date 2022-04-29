import { GLSLExpression, abs, add, cache, def, defFn, length, max, min, retFn, sub, sw } from '../shaderBuilder';

const symbol = Symbol();

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function sdbox(
  p: GLSLExpression<'vec3'>,
  s: GLSLExpression<'vec3'>,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'vec3' ], ( p, s ) => {
    const d = def( 'vec3', sub( abs( p ), s ) );
    const inside = min(
      max( sw( d, 'x' ), max( sw( d, 'y' ), sw( d, 'z' ) ) ),
      0.0,
    );
    const outside = length( max( d, 0.0 ) );
    retFn( add( inside, outside ) );
  } ) );

  return f( p, s );
}
