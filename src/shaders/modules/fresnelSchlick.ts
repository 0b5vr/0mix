import { GLSLExpression, GLSLFloatExpression, max, mix, pow, sub } from '../shaderBuilder';

export function fresnelSchlick<T extends 'float' | 'vec3'>(
  dotVH: GLSLFloatExpression,
  f0: GLSLExpression<T>,
  f90: GLSLExpression<T>,
): GLSLExpression<T> {
  const fresnel = pow( max( 0.0, sub( 1.0, dotVH ) ), 5.0 );
  return mix( f0, f90, fresnel );
}
