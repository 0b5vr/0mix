import { GLSLExpression, assign, cache, defFn, lt, retFn, sw, tern } from '../shaderBuilder';

const symbol = Symbol();

export function foldSortXYZ(
  v: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn( 'vec3', [ 'vec3' ], ( v ) => {
      assign( sw( v, 'xz' ), tern(
        lt( sw( v, 'x' ), sw( v, 'z' ) ),
        sw( v, 'xz' ),
        sw( v, 'zx' ),
      ) );
      assign( sw( v, 'xy' ), tern(
        lt( sw( v, 'x' ), sw( v, 'y' ) ),
        sw( v, 'xy' ),
        sw( v, 'yx' ),
      ) );
      assign( sw( v, 'yz' ), tern(
        lt( sw( v, 'y' ), sw( v, 'z' ) ),
        sw( v, 'yz' ),
        sw( v, 'zy' ),
      ) );

      retFn( v );
    } ),
  );

  return f( v );
}
