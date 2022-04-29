import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, dot, max, mix, mul, normalize, num, retFn, vec3 } from '../shaderBuilder';
import { INV_PI } from '../../utils/constants';
import { dGGX } from './dGGX';
import { fresnelSchlick } from './fresnelSchlick';
import { vGGX } from './vGGX';

const symbol = Symbol();

export function doAnalyticLighting(
  L: GLSLExpression<'vec3'>,
  V: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  roughness: GLSLFloatExpression,
  albedo: GLSLExpression<'vec3'>,
  f0: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec3',
      [ 'vec3', 'vec3', 'vec3', 'float', 'vec3', 'vec3' ],
      ( L, V, N, roughness, albedo, f0 ) => {
        const H = def( 'vec3', normalize( add( L, V ) ) );

        const dotNL = def( 'float', max( dot( N, L ), 1E-3 ) );
        const dotNV = def( 'float', max( dot( N, V ), 1E-3 ) );
        const dotNH = def( 'float', max( dot( N, H ), 1E-3 ) );
        const dotVH = def( 'float', max( dot( V, H ), 1E-3 ) );

        const roughnessSq = mul( roughness, roughness );

        const Vis = vGGX( dotNL, dotNV, roughnessSq );
        const D = dGGX( dotNH, roughnessSq );

        const FSpec = fresnelSchlick( dotVH, f0, vec3( 1.0 ) );
        const diffuse = mul( albedo, INV_PI );
        const specular = vec3( mul( Vis, D ) );

        const outColor = def( 'vec3', mix(
          diffuse,
          specular,
          FSpec,
        ) );

        retFn( max( mul( dotNL, outColor ), 0.0 ) );
      }
    )
  );

  return f( L, V, N, num( roughness ), albedo, f0 );
}
