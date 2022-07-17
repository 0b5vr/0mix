import { GLSLExpression, abs, defUniformNamed, div, min, mul, sub, sw } from '../../../../shaders/shaderBuilder';

export function dofCalcCoC(
  depth: GLSLExpression<'float'>,
): GLSLExpression<'float'> {
  const dofDepthSize = defUniformNamed( 'vec2', 'dofDepthSize' );
  return mul(
    sw( dofDepthSize, 'y' ),
    min( 1.0, abs( div( sub( depth, sw( dofDepthSize, 'x' ) ), depth ) ) ),
  );
}
