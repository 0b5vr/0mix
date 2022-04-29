import { GLSLExpression, GLSLFloatExpression, div, exp, mul, sq } from '../shaderBuilder';

export const glslGaussian = (
  x: GLSLFloatExpression,
  rho: GLSLFloatExpression,
): GLSLExpression<'float'> => (
  exp( div( sq( x ), mul( -2.0, rho, rho ) ) )
) as any;
