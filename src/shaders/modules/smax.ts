import { GLSLExpression, GLSLFloatExpression, abs, add, def, div, max, mul, sub } from '../shaderBuilder';

export const smax: {
  ( a: GLSLFloatExpression, b: GLSLFloatExpression, k: GLSLFloatExpression ): GLSLExpression<'float'>;
  ( a: GLSLExpression<'vec2'>, b: GLSLExpression<'vec2'>, k: GLSLFloatExpression ): GLSLExpression<'vec2'>;
  ( a: GLSLExpression<'vec3'>, b: GLSLExpression<'vec3'>, k: GLSLFloatExpression ): GLSLExpression<'vec3'>;
  ( a: GLSLExpression<'vec4'>, b: GLSLExpression<'vec4'>, k: GLSLFloatExpression ): GLSLExpression<'vec4'>;
} = ( a: any, b: any, k: any ): any => {
  const h = def( 'float', div( max( sub( k, abs( sub( a, b ) ) ), 0.0 ), k ) );
  return add( max( a, b ), mul( h, h, h, k, 1.0 / 6.0 ) );
};
