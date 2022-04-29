import { GLSLExpression, sub } from '../shaderBuilder';
import { glslLofi } from './glslLofi';

export const mod289: {
  ( x: GLSLExpression<'float'> ): GLSLExpression<'float'>;
  ( x: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'>;
  ( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'>;
  ( x: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'>;
} = ( x: any ): any => (
  sub( x, glslLofi( x, 289.0 ) )
);
