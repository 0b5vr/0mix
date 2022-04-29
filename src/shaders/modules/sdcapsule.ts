import { GLSLExpression, div, dot, length, mul, sub } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

/**
 * SDF of capsule.
 * See: https://iquilezles.untergrund.net/www/articles/distfunctions/distfunctions.htm
 */
export const sdcapsule: {
  ( p: GLSLExpression<'vec2'>, tail: GLSLExpression<'vec2'> ): GLSLExpression<'float'>,
  ( p: GLSLExpression<'vec3'>, tail: GLSLExpression<'vec3'> ): GLSLExpression<'float'>,
} = ( p: any, tail: any ) => {
  const h = glslSaturate( div( dot( p, tail ), dot( tail, tail ) ) );
  return length( sub( p, mul( tail, h ) ) as any );
};
