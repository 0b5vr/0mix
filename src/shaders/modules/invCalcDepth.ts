import { GLSLExpression, defUniformNamed, div, mul, sub, sw } from '../shaderBuilder';

/**
 * It probably returns a negative value.
 */
export function invCalcDepth(
  depth: GLSLExpression<'float'>,
): GLSLExpression<'float'> {
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  const near = sw( cameraNearFar, 'x' );
  const far = sw( cameraNearFar, 'y' );
  return div(
    mul( 2.0, near, far ),
    sub( mul( depth, sub( far, near ) ), far, near ),
  );
}
