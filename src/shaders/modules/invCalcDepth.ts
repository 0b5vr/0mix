import { GLSLExpression, mul, sw, div, sub } from '../shaderBuilder';

/**
 * It probably returns a negative value.
 */
export function invCalcDepth(
  depth: GLSLExpression<'float'>,
  cameraNearFar: GLSLExpression<'vec2'>,
): GLSLExpression<'float'> {
  const near = sw( cameraNearFar, 'x' );
  const far = sw( cameraNearFar, 'y' );
  return div(
    mul( 2.0, near, far ),
    sub( mul( depth, sub( far, near ) ), far, near ),
  );
}
