import { GLSLExpression, assign, cache, def, defFn, fract, ifChain, ifThen, lt, mul, normalize, retFn, sub, sw, vec2, vec3 } from '../shaderBuilder';

const symbol = Symbol();

export function cubemapUVInv(
  uv: GLSLExpression<'vec2'>,
): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec2' ], ( uv ) => {
    const uvf = sub( mul( 2.0, fract( mul( vec2( 3.0, 2.0 ), uv ) ) ), 1.0 );

    const v = def( 'vec3', vec3( mul( vec2( -1.0, 1.0 ), uvf ), 1.0 ) );

    ifThen(
      lt( sw( uv, 'y' ), 0.5 ),
      () => ifChain(
        [ // px
          lt( sw( uv, 'x' ), 1.0 / 3.0 ),
          () => assign( v, mul( vec3( 1.0, 1.0, -1.0 ), sw( v, 'zyx' ) ) ),
        ],
        [ // py
          lt( sw( uv, 'x' ), 2.0 / 3.0 ),
          () => assign( v, mul( vec3( 1.0, 1.0, -1.0 ), sw( v, 'xzy' ) ) ),
        ],
        [ // pz
          lt( sw( uv, 'x' ), 3.0 / 3.0 ),
          () => 0,
        ],
      ),
      () => ifChain(
        [ // nx
          lt( sw( uv, 'x' ), 1.0 / 3.0 ),
          () => assign( v, mul( vec3( -1.0, 1.0, 1.0 ), sw( v, 'zyx' ) ) ),
        ],
        [ // ny
          lt( sw( uv, 'x' ), 2.0 / 3.0 ),
          () => assign( v, mul( vec3( 1.0, -1.0, 1.0 ), sw( v, 'xzy' ) ) ),
        ],
        [ // nz
          lt( sw( uv, 'x' ), 3.0 / 3.0 ),
          () => assign( v, mul( vec3( -1.0, 1.0, -1.0 ), v ) ),
        ],
      ),
    );

    retFn( normalize( v ) );
  } ) );

  return f( uv );
}
