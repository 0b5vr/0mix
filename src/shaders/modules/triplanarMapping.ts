import { GLSLExpression, GLSLFloatExpression, abs, add, div, dot, mul, pow, sw, vec3 } from '../shaderBuilder';

export function triplanarMapping<T extends GLSLExpression<'float'> | GLSLExpression<'vec2'> | GLSLExpression<'vec3'> | GLSLExpression<'vec4'>>(
  p: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  smoothFactor: GLSLFloatExpression,
  fn: ( uv: GLSLExpression<'vec2'> ) => T,
): T {
  const nPowered = pow( abs( N ), vec3( smoothFactor ) );

  return div( add(
    mul( fn( sw( p, 'zy' ) ) as any, sw( nPowered, 'x' ) ),
    mul( fn( sw( p, 'xz' ) ) as any, sw( nPowered, 'y' ) ),
    mul( fn( sw( p, 'yx' ) ) as any, sw( nPowered, 'z' ) ),
  ), dot( nPowered, vec3( 1.0 ) ) ) as any;
}
