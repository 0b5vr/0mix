

import { GLSLExpression, GLSLFloatExpression, asin, mul, sin } from '../shaderBuilder';
import { PI, TAU } from '../../utils/constants';

export function glslTri( x: GLSLFloatExpression ): GLSLExpression<'float'>;
export function glslTri( x: GLSLExpression<'vec2'> ): GLSLExpression<'vec2'>;
export function glslTri( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'>;
export function glslTri( x: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'>;
export function glslTri( x: string | number ): string {
  return mul( asin( sin( mul( TAU, x as any ) ) ), 2.0 / PI );
}
