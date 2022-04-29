import { GLSLExpression, add, assign, cache, def, defFn, div, min, mul, pow, retFn, sub, vec2 } from '../shaderBuilder';
import { cubemapUV } from './cubemapUV';

const symbol = Symbol();

export function cubemapUVMip(
  v: GLSLExpression<'vec3'>,
  lv: GLSLExpression<'float'>,
): GLSLExpression<'vec2'> {
  const f = cache( symbol, () => defFn( 'vec2', [ 'vec3', 'float' ], ( v, lv ) => {
    const p = def( 'float', pow( 0.5, lv ) );
    const scale = sub( 1.0, div( 1.0 / 256.0, p ) );

    const offset = def( 'vec2', vec2( 0.0, sub( 1.0, mul( 2.0, p ) ) ) );

    assign( p, pow( 0.5, min( lv, 5.0 ) ) ); // max level is 5
    retFn( add( mul( cubemapUV( v, scale ), p ), offset ) );
  } ) );

  return f( v, lv );
}
