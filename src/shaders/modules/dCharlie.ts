import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, div, max, mul, num, pow, retFn, sq, sub } from '../shaderBuilder';
import { INV_TAU } from '../../utils/constants';

const symbol = Symbol();

export function dCharlie(
  dotNH: GLSLFloatExpression,
  roughnessSq: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn( 'float', [ 'float', 'float' ], ( dotNH, roughnessSq ) => {
      const invRoughnessSq = def( 'float', div( 1.0, roughnessSq ) );
      const sin2h = max( sub( 1.0, sq( dotNH ) ), 0.078125 );
      retFn( mul(
        add( 2.0, invRoughnessSq ),
        pow( sin2h, mul( 0.5, invRoughnessSq ) ),
        INV_TAU,
      ) );
    } )
  );

  return f( num( dotNH ), num( roughnessSq ) );
}
