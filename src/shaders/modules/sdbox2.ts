import { GLSLExpression, abs, add, cache, def, defFn, length, max, min, retFn, sub, sw } from '../shaderBuilder';

const symbol = Symbol();

export function sdbox2(
  p: GLSLExpression<'vec2'>,
  s: GLSLExpression<'vec2'>,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec2', 'vec2' ], ( p, s ) => {
    const d = def( 'vec2', sub( abs( p ), s ) );
    const inside = min(
      max( sw( d, 'x' ), sw( d, 'y' ) ),
      0.0,
    );
    const outside = length( max( d, 0.0 ) );
    retFn( add( inside, outside ) );
  } ) );

  return f( p, s );
}
