import { GLSLExpression, add, div, dot, floor, fract, mul, sub, vec2, vec3 } from '../../../shaders/shaderBuilder';
import { GRID_RESO, GRID_RESO_SQRT } from '../constants';
import { fluidClampToGrid } from './fluidClampToGrid';

export const fluidUvToPos = ( uv: GLSLExpression<'vec2'> ): GLSLExpression<'vec3'> => {
  const uvInGrid = mul( uv, GRID_RESO_SQRT );

  return fluidClampToGrid( sub( vec3(
    fract( uvInGrid ),
    div( add( dot( floor( uvInGrid ), vec2( 1.0, GRID_RESO_SQRT ) ), 0.5 ), GRID_RESO )
  ), 0.5 ) );
};
