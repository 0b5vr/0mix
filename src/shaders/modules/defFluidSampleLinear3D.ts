import { GLSLExpression, add, addAssign, cache, def, defFn, div, fract, mix, mul, neg, retFn, subAssign, sw } from '../shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';

const symbol = Symbol();

export const defFluidSampleLinear3D: {
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
    const fluidSample3DNearest = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );

    const t = fract(
      mul( add( sw( pos, 'z' ), neg( div( 0.5, fGridReso ) ), 0.5 ), fGridReso )
    );
    const a = def( 'vec3', pos );
    subAssign( sw( a, 'z' ), div( t, fGridReso ) );
    const b = def( 'vec3', a );
    addAssign( sw( b, 'z' ), div( 1.0, fGridReso ) );

    retFn( mix(
      fluidSample3DNearest( sampler, a ),
      fluidSample3DNearest( sampler, b ),
      t
    ) );
  } )
);
