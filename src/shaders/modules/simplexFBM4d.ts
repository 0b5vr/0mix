import { GLSLExpression, GLSLFloatExpression, addAssign, def, defFn, div, forLoop, mulAssign, retFn, vec4 } from '../shaderBuilder';
import { simplex4d } from './simplex4d';

export function defSimplexFBM4d( {
  off = vec4( 1.0, 1.0, 1.0, 1.0 ),
  pump = 2.0,
  freq = 2.0,
}: {
  off?: GLSLExpression<'vec4'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
} = {} ): ( p: GLSLExpression<'vec4'> ) => GLSLExpression<'float'> {
  return defFn( 'float', [ 'vec4' ], ( p ) => {
    const accum = def( 'float', 0.0 );
    const amount = def( 'float', 0.0 );
    forLoop( 6, () => {
      mulAssign( p, freq );
      addAssign( p, off );

      addAssign( accum, simplex4d( p ) );
      addAssign( amount, 1.0 );
      mulAssign( accum, pump );
      mulAssign( amount, pump );
    } );
    retFn( div( accum, amount ) );
  } );
}
