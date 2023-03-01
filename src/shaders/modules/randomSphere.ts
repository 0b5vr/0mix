import { GLSLExpression, cache, defFn, retFn } from '../shaderBuilder';
import { glslDefRandom } from './glslDefRandom';
import { uniformSphere } from './uniformSphere';

const symbol = Symbol();

export function randomSphere(): GLSLExpression<'vec3'> {
  const { random2 } = glslDefRandom();

  const f = cache( symbol, () => defFn( 'vec3', [], () => {
    retFn( uniformSphere( random2() ) );
  } ) );

  return f();
}
