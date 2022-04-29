/*!
 * pcg2d
 *
 * Appearance:
 *   Mark Jarzynski and Marc Olano, Hash Functions for GPU Rendering,
 *   Journal of Computer Graphics Techniques (JCGT), vol. 9, no. 3, 21-38, 2020
 *
 * Ref: https://jcgt.org/published/0009/03/02/
 * Ref: https://www.shadertoy.com/view/XlGcRh
 */

import { GLSLExpression, add, addAssign, assign, cache, defFn, mul, retFn, rshift, sw, xorAssign } from '../shaderBuilder';
import { pcgMagic1, pcgMagic2 } from './pcg3d';

type Uint = GLSLExpression<'uint'>;

const symbol = Symbol();

export function pcg2d(
  v: GLSLExpression<'uvec2'>,
): GLSLExpression<'uvec2'> {
  const f = cache( symbol, () => defFn( 'uvec2', [ 'uvec2' ], ( v ) => {
    assign( v, add( mul( v, pcgMagic1 ), pcgMagic2 ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), pcgMagic1 ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'x' ), pcgMagic1 ) );

    xorAssign( v, rshift( v, '16u' as Uint ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), pcgMagic1 ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'x' ), pcgMagic1 ) );

    xorAssign( v, rshift( v, '16u' as Uint ) );

    retFn( v );
  } ) );

  return f( v );
}
