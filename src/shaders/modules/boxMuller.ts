import { GLSLExpression, cache, cos, defFn, log, mul, retFn, sin, sqrt, sw, vec2 } from '../shaderBuilder';
import { TAU } from '../../utils/constants';

const symbol = Symbol();

export function boxMuller( xi: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec2',
      [ 'vec2' ],
      ( xi ) => {
        const r = sqrt( mul( -2.0, log( sw( xi, 'x' ) ) ) );
        const t = mul( TAU, sw( xi, 'y' ) );
        retFn( mul( r, vec2( cos( t ), sin( t ) ) ) );
      }
    )
  );

  return f( xi );
}
