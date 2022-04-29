import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, div, mul, num, retFn, sub } from '../shaderBuilder';
import { PI } from '../../utils/constants';

const symbol = Symbol();

export function dGGX(
  dotNH: GLSLFloatExpression,
  roughnessSq: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn( 'float', [ 'float', 'float' ], ( dotNH, roughnessSq ) => {
      const f = def( 'float', add( mul( dotNH, dotNH, sub( roughnessSq, 1.0 ) ), 1.0 ) );
      retFn( div( roughnessSq, mul( PI, f, f ) ) );
    } )
  );

  return f( num( dotNH ), num( roughnessSq ) );
}
