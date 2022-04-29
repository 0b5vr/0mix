import { GLSLExpression, cache, cos, def, defFn, mul, retFn, sin, sqrt, sub, vec3 } from '../shaderBuilder';
import { PI } from '../../utils/constants';
import { glslDefRandom } from './glslDefRandom';

const symbol = Symbol();

export function uniformSphere(): GLSLExpression<'vec3'> {
  const { random } = glslDefRandom();

  const f = cache( symbol, () => defFn( 'vec3', [], () => {
    const phi = def( 'float', mul( random(), 2.0 * PI ) );
    const cosTheta = def( 'float', sub( mul( 2.0, random() ), 1.0 ) );
    const sinTheta = def( 'float', sqrt( sub( 1.0, mul( cosTheta, cosTheta ) ) ) );
    retFn( vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cosTheta ) );
  } ) );

  return f();
}
