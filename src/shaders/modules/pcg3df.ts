import { GLSLExpression, cache, defFn, div, float, floatBitsToUint, retFn, vec3 } from '../shaderBuilder';
import { pcg3d } from './pcg3d';

const symbol = Symbol();

export function pcg3df( v: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec3' ], ( v ) => {
    const h = vec3( pcg3d( floatBitsToUint( v ) ) );
    retFn( div( h, float( '0xffffffffu' as GLSLExpression<'uint'> ) ) );
  } ) );

  return f( v );
}
