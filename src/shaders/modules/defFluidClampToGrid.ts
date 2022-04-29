import { GLSLExpression, add, clamp, div, sub } from '../shaderBuilder';

export const defFluidClampToGrid: {
  (
    fGridReso: number,
  ): (
    pos: GLSLExpression<'vec3'>,
  ) => GLSLExpression<'vec3'>
} = (
  fGridReso: number,
) => ( pos: GLSLExpression<'vec3'> ) => (
  clamp( pos, add( -0.5, div( 0.5, fGridReso ) ), sub( 0.5, div( 0.5, fGridReso ) ) )
);
