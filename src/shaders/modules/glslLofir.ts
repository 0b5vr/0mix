import { GLSLExpression, GLSLFloatExpression, div, floor, mul, add } from '../shaderBuilder';

export function glslLofir( x: GLSLFloatExpression, y: GLSLFloatExpression ): GLSLExpression<'float'>;
export function glslLofir( x: GLSLExpression<'vec2'>, y: GLSLExpression<'vec2'> | GLSLFloatExpression ): GLSLExpression<'vec2'>;
export function glslLofir( x: GLSLExpression<'vec3'>, y: GLSLExpression<'vec3'> | GLSLFloatExpression ): GLSLExpression<'vec3'>;
export function glslLofir( x: GLSLExpression<'vec4'>, y: GLSLExpression<'vec4'> | GLSLFloatExpression ): GLSLExpression<'vec4'>;
export function glslLofir( x: string | number, y: string | number ): string {
  return mul( floor( add( div( x as any, y as any ), 0.5 ) ), y as any );
}
