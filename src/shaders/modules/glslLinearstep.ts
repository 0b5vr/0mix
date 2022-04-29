import { GLSLExpression, GLSLFloatExpression, div, sub } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

export const glslLinearstep: {
  (
    a: GLSLFloatExpression,
    b: GLSLFloatExpression,
    x: GLSLFloatExpression,
  ): GLSLExpression<'float'>;
  (
    a: GLSLFloatExpression | GLSLExpression<'vec2'>,
    b: GLSLFloatExpression | GLSLExpression<'vec2'>,
    x: GLSLFloatExpression | GLSLExpression<'vec2'>,
  ): GLSLExpression<'vec2'>;
  (
    a: GLSLFloatExpression | GLSLExpression<'vec3'>,
    b: GLSLFloatExpression | GLSLExpression<'vec3'>,
    x: GLSLFloatExpression | GLSLExpression<'vec3'>,
  ): GLSLExpression<'vec3'>;
  (
    a: GLSLFloatExpression | GLSLExpression<'vec4'>,
    b: GLSLFloatExpression | GLSLExpression<'vec4'>,
    x: GLSLFloatExpression | GLSLExpression<'vec4'>,
  ): GLSLExpression<'vec4'>;
} = ( a: any, b: any, x: any ) => glslSaturate( div(
  sub( x, a ),
  sub( b, a ),
) ) as any;
