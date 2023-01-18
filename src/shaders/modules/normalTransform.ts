import { GLSLExpression, arrayIndex, def, div, dot, int, mat3, mul, normalize, vec3 } from '../shaderBuilder';

/**
 * Transform a normal using a model matrix (without shearing).
 * No "normal matrix" required.
 *
 * Ref: https://github.com/mrdoob/three.js/issues/18497#issuecomment-583771048
 *
 * @param matrix The model matrix
 * @param normal The normal you want to transform
 * @returns The transformed normal
 */
export function normalTransform(
  matrix: GLSLExpression<'mat4'>,
  normal: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const m = def( 'mat3', mat3( matrix ) );

  const s2 = vec3(
    dot( arrayIndex( m, int( 0 ) ), arrayIndex( m, int( 0 ) ) ),
    dot( arrayIndex( m, int( 1 ) ), arrayIndex( m, int( 1 ) ) ),
    dot( arrayIndex( m, int( 2 ) ), arrayIndex( m, int( 2 ) ) ),
  );

  return normalize( mul( m, div( normal, s2 ) ) );
}
