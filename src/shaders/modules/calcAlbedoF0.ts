import { DIELECTRIC_SPECULAR, ONE_SUB_DIELECTRIC_SPECULAR } from '../../utils/constants';
import { GLSLExpression, GLSLFloatExpression, GLSLToken, def, mix, mul, vec3 } from '../shaderBuilder';

export function calcAlbedoF0(
  baseColor: GLSLExpression<'vec3'>,
  metallic: GLSLFloatExpression,
): {
    albedo: GLSLToken<'vec3'>,
    f0: GLSLToken<'vec3'>,
  } {
  return {
    albedo: def( 'vec3', (
      mix( mul( baseColor, ONE_SUB_DIELECTRIC_SPECULAR ), vec3( 0.0 ), metallic )
    ) ),
    f0: def( 'vec3', (
      mix( DIELECTRIC_SPECULAR, baseColor, metallic )
    ) ),
  };
}
