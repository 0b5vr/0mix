import { GLSLExpression, cache, defFn, div, float, floatBitsToUint, retFn, vec4 } from '../shaderBuilder';
import { pcg4d } from './pcg4d';

const symbol = Symbol();

export function pcg4df( v: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec4' ], ( v ) => {
    const h = vec4( pcg4d( floatBitsToUint( v ) ) );
    retFn( div( h, float( '0xffffffffu' as GLSLExpression<'uint'> ) ) );
  } ) );

  return f( v );
}
