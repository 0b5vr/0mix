import { GLSLExpression, GLSLFloatExpression, addAssign, cache, cos, cross, def, defFn, div, mul, mulAssign, num, retFn, sin, sw, unrollLoop, vec3, vec4 } from '../shaderBuilder';
import { orthBas } from './orthBas';

const symbol = Symbol();

export function cyclicNoise( p: GLSLExpression<'vec3'>, {
  rot = vec3( -1.0 ),
  pump = 2.0,
  freq = 2.0,
  warp = 1.0,
}: {
  rot?: GLSLExpression<'vec3'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
  warp?: GLSLFloatExpression,
} = {} ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn(
    'vec3',
    [ 'vec3', 'vec3', 'float', 'float', 'float' ],
    ( p, rot, pump, freq, warp ) => {
      const b = def( 'mat3', orthBas( rot ) );
      const accum = def( 'vec4', vec4( 0.0 ) );
      unrollLoop( 6, () => {
        mulAssign( p, mul( b, freq ) );
        addAssign( p, mul( warp, sin( sw( p, 'zxy' ) ) ) );
        addAssign( accum, vec4( cross( cos( p ), sin( sw( p, 'yzx' ) ) ), 1.0 ) );
        mulAssign( accum, pump );
      } );
      retFn( div( sw( accum, 'xyz' ), sw( accum, 'w' ) ) );
    },
  ) );

  return f( p, rot, num( pump ), num( freq ), num( warp ) );
}
