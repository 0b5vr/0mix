import { GLSLExpression, GLSLFloatExpression, add, mul, sub } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export const glslSmootherstep: {
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
} = ( a: any, b: any, x: any ) => {
  const t = glslLinearstep( a, b, x );
  return ( mul( t, t, t, add( mul( t, sub( mul( t, 6.0 ), 15.0 ) ), 10.0 ) ) ) as any;
};
