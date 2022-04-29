import { GLSLExpression, cache, def, defFn, dot, lt, neg, retFn, tern } from '../shaderBuilder';
import { uniformSphere } from './uniformSphere';

const symbol = Symbol();

export function uniformHemisphere( n: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec3' ], ( n ) => {
    const d = def( 'vec3', uniformSphere() );
    retFn( tern( lt( dot( d, n ), 0.0 ), neg( d ), d ) );
  } ) );

  return f( n );
}
