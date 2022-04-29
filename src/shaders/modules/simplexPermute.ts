import { GLSLExpression, add, mul } from '../shaderBuilder';
import { mod289 } from './mod289';

export const permute: {
  ( x: GLSLExpression<'float'> ): GLSLExpression<'float'>;
  ( x: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'>;
  ( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'>;
  ( x: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'>;
} = ( x: any ): any => (
  mod289( mul( add( mul( x, 34.0 ), 1.0 ), x ) )
);
