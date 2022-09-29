import { GLSLExpression, add, clamp, div, sub } from '../../../shaders/shaderBuilder';
import { GRID_RESO } from '../constants';

export const fluidClampToGrid = ( pos: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> => (
  clamp( pos, add( -0.5, div( 0.5, GRID_RESO ) ), sub( 0.5, div( 0.5, GRID_RESO ) ) )
);
