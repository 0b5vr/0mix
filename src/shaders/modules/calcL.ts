import { GLSLExpression, GLSLToken, def, divAssign, length, max, sub } from '../shaderBuilder';

export function calcL(
  lightPos: GLSLExpression<'vec3'>,
  surfacePos: GLSLExpression<'vec3'>,
): [ L: GLSLToken<'vec3'>, lenL: GLSLToken<'float'> ] {
  const L = def( 'vec3', sub( lightPos, surfacePos ) );
  const lenL = def( 'float', length( L ) );
  divAssign( L, max( 1E-3, lenL ) );

  return [ L, lenL ];
}
