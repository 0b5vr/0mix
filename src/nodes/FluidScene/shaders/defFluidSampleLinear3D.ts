import { GLSLExpression, add, addAssign, cache, def, defFn, div, fract, mix, mul, neg, retFn, subAssign, sw } from '../../../shaders/shaderBuilder';
import { GRID_RESO } from '../constants';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';

const symbol = Symbol();

export const defFluidSampleLinear3D: {
  (): (
    sampler: GLSLExpression<'sampler2D'>,
    pos: GLSLExpression<'vec3'>,
  ) => GLSLExpression<'vec4'>
} = () => cache(
  symbol,
  () => defFn( 'vec4', [ 'sampler2D', 'vec3' ], ( sampler, pos ) => {
    const fluidSample3DNearest = defFluidSampleNearest3D();

    const t = fract(
      mul( add( sw( pos, 'z' ), neg( div( 0.5, GRID_RESO ) ), 0.5 ), GRID_RESO )
    );
    const a = def( 'vec3', pos );
    subAssign( sw( a, 'z' ), div( t, GRID_RESO ) );
    const b = def( 'vec3', a );
    addAssign( sw( b, 'z' ), div( 1.0, GRID_RESO ) );

    retFn( mix(
      fluidSample3DNearest( sampler, a ),
      fluidSample3DNearest( sampler, b ),
      t
    ) );
  } )
);
