import { abs, div, GLSLExpression, min, mul, sub } from '../../../../shaders/shaderBuilder';

export function dofCalcCoC(
  depth: GLSLExpression<'float'>,
): GLSLExpression<'float'> {
  return mul( 8.0, min( 1.0, abs( div( sub( depth, 2.0 ), depth ) ) ) );
}
