import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, dot, float, max, mul, normalize, num, retFn, vec3, vec4 } from '../shaderBuilder';
import { dGGX } from './dGGX';
import { fresnelSchlick } from './fresnelSchlick';
import { vKelemen } from './vKelemen';

const symbol = Symbol();

/**
 * the fourth component of return value is fresnel term,
 * intended to be used for energy conservation funnies
 */
export function brdfClearcoat(
  L: GLSLExpression<'vec3'>,
  V: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  roughness: GLSLFloatExpression,
): GLSLExpression<'vec4'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec4',
      [ 'vec3', 'vec3', 'vec3', 'float' ],
      ( L, V, N, roughness ) => {
        const H = def( 'vec3', normalize( add( L, V ) ) );
        const dotNH = def( 'float', max( dot( N, H ), 0.0 ) );
        const dotVH = def( 'float', max( dot( V, H ), 0.0 ) );

        const roughnessSq = mul( roughness, roughness );

        const F = fresnelSchlick( dotVH, float( 0.04 ), float( 1.0 ) );
        const Vis = vKelemen( dotVH );
        const D = dGGX( dotNH, roughnessSq );

        retFn( vec4( vec3( mul( F, Vis, D ) ), F ) );
      }
    )
  );

  return f( L, V, N, num( roughness ) );
}
