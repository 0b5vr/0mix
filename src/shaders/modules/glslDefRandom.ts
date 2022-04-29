import { GLSLExpression, GLSLToken, add, assign, cache, def, defConst, defFn, defGlobal, div, dot, floor, fract, insert, mul, neg, retFn, sign, sub, unrollLoop, vec4 } from '../shaderBuilder';

const symbolSeed = Symbol();
const symbolRandom = Symbol();
const symbolInitRandom = Symbol();

// Ref: https://cs.uwaterloo.ca/~thachisu/tdf2015.pdf
export function glslDefRandom(): {
  random: () => GLSLExpression<'float'>,
  seed: GLSLToken<'vec4'>,
  init: ( seed: GLSLExpression<'vec4'> ) => void,
} {
  const seed = cache( symbolSeed, () => defGlobal( 'vec4' ) );

  const random = cache(
    symbolRandom,
    () => defFn( 'float', [], () => {
      const q = defConst( 'vec4', vec4( 1225, 1585, 2457, 2098 ) );
      const r = defConst( 'vec4', vec4( 1112, 367, 92, 265 ) );
      const a = defConst( 'vec4', vec4( 3423, 2646, 1707, 1999 ) );
      const m = defConst( 'vec4', vec4( 4194287, 4194277, 4194191, 4194167 ) );
      const beta = def( 'vec4', floor( div( seed, q ) ) );
      const p = def( 'vec4', sub( mul( a, sub( seed, mul( beta, q ) ) ), mul( beta, r ) ) );
      assign( beta, mul( add( neg( sign( p ) ), vec4( 1 ) ), vec4( 0.5 ), m ) );
      assign( seed, add( p, beta ) );
      retFn( fract( dot( div( seed, m ), vec4( 1, -1, 1, -1 ) ) ) );
    } )
  );

  const init = cache(
    symbolInitRandom,
    () => ( _seed: GLSLExpression<'vec4'> ) => {
      assign( seed, _seed );
      unrollLoop( 3, () => insert( `${ random() };` ) );
    }
  );

  return { random, seed, init };
}
