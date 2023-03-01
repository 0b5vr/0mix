import { GLSLExpression, cache, def, defFn, dot, lt, neg, retFn, tern } from '../shaderBuilder';
import { randomSphere } from './randomSphere';

const symbol = Symbol();

export function randomHemisphere( n: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec3' ], ( n ) => {
    const d = def( 'vec3', randomSphere() );
    retFn( tern( lt( dot( d, n ), 0.0 ), neg( d ), d ) );
  } ) );

  return f( n );
}
