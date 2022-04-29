import { GLSLExpression, add, div, dot, floor, fract, mul, sub, vec2, vec3 } from '../shaderBuilder';
import { defFluidClampToGrid } from './defFluidClampToGrid';

export const defFluidUvToPos: {
  (
    fGridResoSqrt: number,
    fGridReso: number,
  ): (
    uv: GLSLExpression<'vec2'>,
  ) => GLSLExpression<'vec3'>
} = (
  fGridResoSqrt: number,
  fGridReso: number,
) => ( uv: GLSLExpression<'vec2'> ) => {
  const clampToGrid = defFluidClampToGrid( fGridReso );

  const uvInGrid = mul( uv, fGridResoSqrt );

  return clampToGrid( sub( vec3(
    fract( uvInGrid ),
    div( add( dot( floor( uvInGrid ), vec2( 1.0, fGridResoSqrt ) ), 0.5 ), fGridReso )
  ), 0.5 ) );
};
