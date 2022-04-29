import { GLSLExpression, cache, cos, def, defFn, mul, retFn, sin, sqrt, sub, vec3 } from '../shaderBuilder';
import { PI } from '../../utils/constants';
import { glslDefRandom } from './glslDefRandom';
import { orthBas } from './orthBas';

const symbol = Symbol();

export function sampleLambert( n: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const { random } = glslDefRandom();

  const f = cache( symbol, () => defFn( 'vec3', [ 'vec3' ], ( n ) => {
    const phi = def( 'float', mul( random(), 2.0 * PI ) );
    const cosTheta = def( 'float', sqrt( random() ) );
    const sinTheta = def( 'float', sub( 1.0, mul( cosTheta, cosTheta ) ) );
    retFn( mul(
      orthBas( n ),
      vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cosTheta ),
    ) );
  } ) );

  return f( n );
}
