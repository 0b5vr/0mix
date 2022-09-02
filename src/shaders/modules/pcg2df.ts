import { GLSLExpression, cache, defFn, div, float, floatBitsToUint, retFn, vec2 } from '../shaderBuilder';
import { pcg2d } from './pcg2d';

const symbol = Symbol();

export function pcg2df( v: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'> {
  const f = cache( symbol, () => defFn( 'vec2', [ 'vec2' ], ( v ) => {
    const h = vec2( pcg2d( floatBitsToUint( v ) ) );
    retFn( div( h, float( '0xffffffffu' as GLSLExpression<'uint'> ) ) );
  } ) );

  return f( v );
}
