import { GLSLExpression, cache, cos, def, defFn, mul, retFn, sin, sqrt, sub, sw, vec3 } from '../shaderBuilder';
import { PI } from '../../utils/constants';

const symbol = Symbol();

export function uniformSphere( xi: GLSLExpression<'vec2'> ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec2' ], ( xi ) => {
    const phi = def( 'float', mul( sw( xi, 'x' ), 2.0 * PI ) );
    const cosTheta = def( 'float', sub( mul( 2.0, sw( xi, 'y' ) ), 1.0 ) );
    const sinTheta = def( 'float', sqrt( sub( 1.0, mul( cosTheta, cosTheta ) ) ) );
    retFn( vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cosTheta ) );
  } ) );

  return f( xi );
}
