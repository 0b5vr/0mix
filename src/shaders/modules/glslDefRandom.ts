import { GLSLExpression, GLSLToken, assign, cache, defFn, defGlobal, div, float, floatBitsToUint, insert, retFn, sw, unrollLoop, vec4 } from '../shaderBuilder';
import { pcg4d } from './pcg4d';

const symbolSeed = Symbol();
const symbolRandom4 = Symbol();
const symbolInitRandom = Symbol();

export function glslDefRandom(): {
  random: () => GLSLExpression<'float'>,
  random2: () => GLSLExpression<'vec2'>,
  random3: () => GLSLExpression<'vec3'>,
  random4: () => GLSLExpression<'vec4'>,
  seed: GLSLToken<'uvec4'>,
  init: ( seed: GLSLExpression<'vec4'> ) => void,
  } {
  const seed = cache( symbolSeed, () => defGlobal( 'uvec4' ) );

  const random4 = cache( symbolRandom4, () => defFn( 'vec4', [], () => {
    assign( seed, pcg4d( seed ) );
    retFn( div( vec4( seed ), float( '0xffffffffu' as GLSLExpression<'uint'> ) ) );
  } ) );

  const random = (): GLSLExpression<'float'> => sw( random4(), 'x' );
  const random2 = (): GLSLExpression<'vec2'> => sw( random4(), 'xy' );
  const random3 = (): GLSLExpression<'vec3'> => sw( random4(), 'xyz' );

  const init = cache(
    symbolInitRandom,
    () => ( _seed: GLSLExpression<'vec4'> ) => {
      assign( seed, floatBitsToUint( _seed ) );
      unrollLoop( 3, () => insert( `${ random() };` ) );
    }
  );

  return { random, random2, random3, random4, seed, init };
}
