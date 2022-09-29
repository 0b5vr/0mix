import { GLSLExpression, add, addAssign, cache, def, defFn, div, floor, mod, mul, retFn, sw, texture, vec2 } from '../../../shaders/shaderBuilder';
import { GRID_RESO, GRID_RESO_SQRT } from '../constants';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';

const symbol = Symbol();

export const defFluidSampleNearest3D: {
  (): (
    sampler: GLSLExpression<'sampler2D'>,
    pos: GLSLExpression<'vec3'>,
  ) => GLSLExpression<'vec4'>
} = () => cache(
  symbol,
  () => defFn( 'vec4', [ 'sampler2D', 'vec3' ], ( sampler, pos ) => {
    const uv = def( 'vec2', div(
      glslSaturate( add( sw( pos, 'xy' ), 0.5 ) ),
      GRID_RESO_SQRT,
    ) );
    const z = def( 'float', glslSaturate( add( sw( pos, 'z' ), 0.5 ) ) );
    addAssign( uv, div( vec2(
      mod( floor( mul( z, GRID_RESO ) ), GRID_RESO_SQRT ),
      floor( mul( z, GRID_RESO_SQRT ) ),
    ), GRID_RESO_SQRT ) );

    retFn( texture( sampler, uv ) );
  } )
);
