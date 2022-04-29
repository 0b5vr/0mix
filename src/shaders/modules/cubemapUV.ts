import { GLSLExpression, abs, cache, def, defFn, div, eq, mix, mul, retFn, sign, step, sw, ternChain, vec2, vec3 } from '../shaderBuilder';

const symbol = Symbol();

export function cubemapUV(
  v: GLSLExpression<'vec3'>,
  scale: GLSLExpression<'float'>,
): GLSLExpression<'vec2'> {
  const f = cache( symbol, () => defFn( 'vec2', [ 'vec3', 'float' ], ( v, scale ) => {
    const va = def( 'vec3', abs( v ) );
    const face = def( 'vec3', mul(
      sign( v ),
      step( sw( va, 'yzx' ), va ),
      step( sw( va, 'zxy' ), va ),
    ) );

    const uv = ternChain(
      vec2( 0.0 ),
      [ // px
        eq( face, vec3( 1, 0, 0 ) ),
        mix(
          vec2( 0.5, 0.5 ),
          vec2( 1.0, 1.0 ),
          div( vec2( mul( scale, sw( v, 'zy' ) ) ), sw( v, 'x' ) )
        ),
      ],
      [ // nx
        eq( face, vec3( -1, 0, 0 ) ),
        mix(
          vec2( 0.5, 1.5 ),
          vec2( 1.0, 1.0 ),
          div( vec2( mul( scale, sw( v, 'zy' ) ) ), sw( v, 'x' ) )
        ),
      ],
      [ // py
        eq( face, vec3( 0, 1, 0 ) ),
        mix(
          vec2( 1.5, 0.5 ),
          vec2( 1.0, 0.0 ),
          div( vec2( mul( scale, sw( v, 'xz' ) ) ), sw( v, 'y' ) )
        ),
      ],
      [ // ny
        eq( face, vec3( 0, -1, 0 ) ),
        mix(
          vec2( 1.5, 1.5 ),
          vec2( 2.0, 1.0 ),
          div( vec2( mul( scale, sw( v, 'xz' ) ) ), sw( v, 'y' ) )
        ),
      ],
      [ // pz
        eq( face, vec3( 0, 0, 1 ) ),
        mix(
          vec2( 2.5, 0.5 ),
          vec2( 2.0, 1.0 ),
          div( vec2( mul( scale, sw( v, 'xy' ) ) ), sw( v, 'z' ) )
        ),
      ],
      [ // nz
        eq( face, vec3( 0, 0, -1 ) ),
        mix(
          vec2( 2.5, 1.5 ),
          vec2( 2.0, 1.0 ),
          div( vec2( mul( scale, sw( v, 'xy' ) ) ), sw( v, 'z' ) )
        ),
      ],
    );

    retFn( div( uv, vec2( 3.0, 2.0 ) ) );
  } ) );

  return f( v, scale );
}
