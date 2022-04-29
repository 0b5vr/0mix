import { GLSLExpression, GLSLFloatExpression, div, mul } from '../shaderBuilder';

// Ref: https://google.github.io/filament/Filament.md.html#materialsystem/clearcoatmodelconst symbol = Symbol();
export function vKelemen(
  dotLH: GLSLFloatExpression,
): GLSLExpression<'float'> {
  return div( 0.25, mul( dotLH, dotLH ) );
}
