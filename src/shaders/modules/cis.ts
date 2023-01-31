import { GLSLExpression, GLSLFloatExpression, cos, sin, vec2 } from '../shaderBuilder';

export const cis: ( x: GLSLFloatExpression ) => GLSLExpression<'vec2'>
  = ( x ) => vec2( cos( x ), sin( x ) );
