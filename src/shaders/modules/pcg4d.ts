/* !
 * pcg4d
 *
 * Appearance:
 *   Mark Jarzynski and Marc Olano, Hash Functions for GPU Rendering,
 *   Journal of Computer Graphics Techniques (JCGT), vol. 9, no. 3, 21-38, 2020
 *
 * Ref: https://jcgt.org/published/0009/03/02/
 * Ref: https://www.shadertoy.com/view/XlGcRh
 */

import { GLSLExpression, add, addAssign, assign, cache, defFn, mul, retFn, rshift, sw, xorAssign } from '../shaderBuilder';

type Uint = GLSLExpression<'uint'>;

const symbol = Symbol();

export const pcgMagic1 = '1664525u' as Uint;
export const pcgMagic2 = '1013904223u' as Uint;

export function pcg4d(
  v: GLSLExpression<'uvec4'>,
): GLSLExpression<'uvec4'> {
  const f = cache( symbol, () => defFn( 'uvec4', [ 'uvec4' ], ( v ) => {
    assign( v, add( mul( v, pcgMagic1 ), pcgMagic2 ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), sw( v, 'w' ) ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'z' ), sw( v, 'x' ) ) );
    addAssign( sw( v, 'z' ), mul( sw( v, 'x' ), sw( v, 'y' ) ) );
    addAssign( sw( v, 'w' ), mul( sw( v, 'y' ), sw( v, 'z' ) ) );

    xorAssign( v, rshift( v, '16u' as Uint ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), sw( v, 'w' ) ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'z' ), sw( v, 'x' ) ) );
    addAssign( sw( v, 'z' ), mul( sw( v, 'x' ), sw( v, 'y' ) ) );
    addAssign( sw( v, 'w' ), mul( sw( v, 'y' ), sw( v, 'z' ) ) );

    retFn( v );
  } ) );

  return f( v );
}
