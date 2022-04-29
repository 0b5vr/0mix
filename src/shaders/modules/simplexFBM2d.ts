import { GLSLExpression, GLSLFloatExpression, addAssign, def, defFn, div, forLoop, mulAssign, retFn, vec2 } from '../shaderBuilder';
import { simplex2d } from './simplex2d';

export function defSimplexFBM2d( {
  off = vec2( 1.0, 1.0 ),
  pump = 2.0,
  freq = 2.0,
}: {
  off?: GLSLExpression<'vec2'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
} = {} ): ( p: GLSLExpression<'vec2'> ) => GLSLExpression<'float'> {
  return defFn( 'float', [ 'vec2' ], ( p ) => {
    const accum = def( 'float', 0.0 );
    const amount = def( 'float', 0.0 );
    forLoop( 6, () => {
      mulAssign( p, freq );
      addAssign( p, off );

      addAssign( accum, simplex2d( p ) );
      addAssign( amount, 1.0 );
      mulAssign( accum, pump );
      mulAssign( amount, pump );
    } );
    retFn( div( accum, amount ) );
  } );
}
