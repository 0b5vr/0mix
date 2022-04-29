import { GLSLExpression, acos, cache, cos, defFn, mul, retFn, sin, sub, sw, vec3 } from '../shaderBuilder';
import { TAU } from '../../utils/constants';

const symbol = Symbol();

export function equimapUV(
  uv: GLSLExpression<'vec2'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn( 'vec3', [ 'vec2' ], ( uv ) => {
      const phi = mul( TAU, sw( uv, 'x' ) );
      const theta = acos( sub( mul( 2.0, sw( uv, 'y' ) ), 1.0 ) );
      retFn( vec3(
        mul( cos( phi ), sin( theta ) ),
        cos( theta ),
        mul( sin( phi ), sin( theta ) ),
      ) );
    } ),
  );

  return f( uv );
}
