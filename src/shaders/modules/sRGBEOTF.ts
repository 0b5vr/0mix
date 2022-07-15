import { GLSLExpression, def, mix, pow, step, div, add, vec3 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

export function sRGBEOTF( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const x_ = def( 'vec3', glslSaturate( x ) as GLSLExpression<'vec3'> );
  return mix(
    div( x_, 12.92 ),
    pow( div( add( x_, 0.055 ), 1.055 ), vec3( 2.4 ) ),
    step( 0.04045, x_ )
  );
}
