import { GLSLExpression, GLSLFloatExpression, add, cache, defFn, div, mul, neg, num, retFn } from '../shaderBuilder';

const symbol = Symbol();

export function vNeubelt(
  dotNL: GLSLFloatExpression,
  dotNV: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn( 'float', [ 'float', 'float' ], ( dotNL, dotNV ) => {
      retFn( div(
        1.0,
        mul(
          4.0,
          add( dotNL, dotNV, neg( mul( dotNL, dotNV ) ) ),
        )
      ) );
    } )
  );

  return f( num( dotNL ), num( dotNV ) );
}
