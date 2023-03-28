import { FAR } from '../../config';
import { GLSLExpression, cache, def, defFn, div, dot, lt, retFn, tern } from '../shaderBuilder';

const symbol = Symbol();

export function isectPlane(
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  n: GLSLExpression<'vec3'>,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'vec3', 'vec3' ], ( ro, rd, n ) => {
    const t = def( 'float', div( dot( ro, n ), -1.0, dot( rd, n ) ) );
    retFn( tern( lt( t, 0.0 ), FAR, t ) );
  } ) );

  return f( ro, rd, n );
}
