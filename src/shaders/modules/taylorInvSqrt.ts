import { GLSLExpression, mul, sub } from '../shaderBuilder';

export const taylorInvSqrt: {
  ( r: GLSLExpression<'float'> ): GLSLExpression<'float'>;
  ( r: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'>;
  ( r: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'>;
  ( r: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'>;
} = ( r: any ): any => (
  sub( 1.79284291400159, mul( 0.85373472095314, r ) )
);
