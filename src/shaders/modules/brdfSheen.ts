import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, dot, max, mul, normalize, num, retFn, sq } from '../shaderBuilder';
import { dCharlie } from './dCharlie';
import { vNeubelt } from './vNeubelt';

const symbol = Symbol();

export function brdfSheen(
  L: GLSLExpression<'vec3'>,
  V: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  roughness: GLSLFloatExpression,
  tint: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec3',
      [ 'vec3', 'vec3', 'vec3', 'float', 'vec3' ],
      ( L, V, N, roughness, tint ) => {
        const H = def( 'vec3', normalize( add( L, V ) ) );
        const dotNL = def( 'float', max( dot( N, L ), 1E-3 ) );
        const dotNV = def( 'float', max( dot( N, V ), 1E-3 ) );
        const dotNH = def( 'float', max( dot( N, H ), 1E-3 ) );

        const Vis = vNeubelt( dotNL, dotNV );
        const D = dCharlie( dotNH, sq( roughness ) );

        retFn( mul( tint, Vis, D ) );
      }
    )
  );

  return f( L, V, N, num( roughness ), tint );
}
