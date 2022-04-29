import { GLSLExpression, GLSLFloatExpression, clamp } from '../shaderBuilder';

export const glslSaturate: {
  ( val: GLSLFloatExpression ): GLSLExpression<'float'>,
  ( val: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'>,
  ( val: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'>,
  ( val: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'>,
} = ( val: string | number ) => clamp( val as any, 0.0, 1.0 ) as any;
