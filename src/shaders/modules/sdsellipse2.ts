import { GLSLExpression, GLSLFloatExpression, abs, add, cache, defFn, div, num, pow, retFn, sw } from '../shaderBuilder';

/*!
 * The superellipse SDF is taken from iq's shadertoy
 * (c) 2022 Inigo Quilez, MIT License
 *
 * https://www.shadertoy.com/view/7stcR4
 */

const symbol = Symbol();

/**
 * Return an sdf of superellipse.
 * You may want to subtract a "radius" from the result.
 */
export function sdsellipse2(
  p: GLSLExpression<'vec2'>,
  n: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec2', 'float' ], ( p, n ) => {
    retFn( pow(
      add(
        pow( abs( sw( p, 'x' ) ), n ),
        pow( abs( sw( p, 'y' ) ), n ),
      ),
      div( 1.0, n ),
    ) );
  } ) );

  return f( p, num( n ) );
}
