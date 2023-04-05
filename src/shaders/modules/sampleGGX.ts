import { GLSLExpression, GLSLFloatExpression, add, cache, cos, def, defFn, div, mul, num, retFn, sin, sqrt, sub, sw, vec3 } from '../shaderBuilder';
import { PI } from '../../utils/constants';
import { orthBas } from './orthBas';

const symbol = Symbol();

export function sampleGGX(
  Xi: GLSLExpression<'vec2'>,
  N: GLSLExpression<'vec3'>,
  roughnessSq: GLSLFloatExpression,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn( 'vec3', [ 'vec2', 'vec3', 'float' ], ( Xi, N, roughnessSq ) => {
      const phi = def( 'float', mul( sw( Xi, 'x' ), 2.0 * PI ) );
      const cosTheta = def( 'float', sqrt( div(
        sub( 1.0, sw( Xi, 'y' ) ),
        add( 1.0, mul( sub( roughnessSq, 1.0 ), sw( Xi, 'y' ) ) )
      ) ) );
      const sinTheta = def( 'float', sub( 1.0, mul( cosTheta, cosTheta ) ) );
      retFn( mul(
        orthBas( N ),
        vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cosTheta ),
      ) );
    } )
  );

  return f( Xi, N, num( roughnessSq ) );
}
