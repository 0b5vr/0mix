import { GLSLExpression, add, addAssign, cache, def, defFn, div, floor, mod, mul, retFn, sw, texture, vec2 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

const symbol = Symbol();

export const defFluidSampleNearest3D: {
  (
    fGridResoSqrt: number,
    fGridReso: number,
  ): (
    sampler: GLSLExpression<'sampler2D'>,
    pos: GLSLExpression<'vec3'>,
  ) => GLSLExpression<'vec4'>
} = (
  fGridResoSqrt: number,
  fGridReso: number,
) => cache(
  symbol,
  () => defFn( 'vec4', [ 'sampler2D', 'vec3' ], ( sampler, pos ) => {
    const uv = def( 'vec2', div(
      glslSaturate( add( sw( pos, 'xy' ), 0.5 ) ),
      fGridResoSqrt,
    ) );
    const z = def( 'float', glslSaturate( add( sw( pos, 'z' ), 0.5 ) ) );
    addAssign( uv, div( vec2(
      mod( floor( mul( z, fGridReso ) ), fGridResoSqrt ),
      floor( mul( z, fGridResoSqrt ) ),
    ), fGridResoSqrt ) );

    retFn( texture( sampler, uv ) );
  } )
);
