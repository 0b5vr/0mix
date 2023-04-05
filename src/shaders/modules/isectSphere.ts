import { FAR } from '../../config';
import { GLSLExpression, GLSLFloatExpression, add, assign, cache, def, defFn, dot, ifThen, lt, mad, neg, normalize, num, retFn, sq, sqrt, sub, vec4 } from '../shaderBuilder';

const symbol = Symbol();

export function isectSphere(
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  r: GLSLFloatExpression,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec3', 'vec3', 'float' ], ( ro, rd, r ) => {
    const b = def( 'float', dot( ro, rd ) );
    const c = sub( dot( ro, ro ), sq( r ) );
    const h = def( 'float', sub( sq( b ), c ) );

    ifThen( lt( h, 0.0 ), () => retFn( vec4( FAR ) ) );

    assign( h, sqrt( h ) );
    const d = def( 'float', neg( add( b, h ) ) );
    const N = normalize( mad( d, rd, ro ) );
    retFn( vec4( N, d ) );
  } ) );

  return f( ro, rd, num( r ) );
}
