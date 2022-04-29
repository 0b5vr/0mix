import { GLSLExpression, GLSLFloatExpression, addAssign, def, defFn, div, forLoop, mulAssign, retFn, vec3 } from '../shaderBuilder';
import { simplex3d } from './simplex3d';

export function defSimplexFBM3d( {
  off = vec3( 1.0, 1.0, 1.0 ),
  pump = 2.0,
  freq = 2.0,
}: {
  off?: GLSLExpression<'vec3'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
} = {} ): ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'float'> {
  return defFn( 'float', [ 'vec3' ], ( p ) => {
    const accum = def( 'float', 0.0 );
    const amount = def( 'float', 0.0 );
    forLoop( 6, () => {
      mulAssign( p, freq );
      addAssign( p, off );

      addAssign( accum, simplex3d( p ) );
      addAssign( amount, 1.0 );
      mulAssign( accum, pump );
      mulAssign( amount, pump );
    } );
    retFn( div( accum, amount ) );
  } );
}
