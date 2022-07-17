import { GLSLExpression, def, mix, mul, pow, step, sub, vec3 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

export function sRGBOETF( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const x_ = def( 'vec3', glslSaturate( x ) as GLSLExpression<'vec3'> );
  return mix(
    mul( x_, 12.92 ),
    sub( mul( pow( x_, vec3( 0.4167 ) ), 1.055 ), 0.055 ),
    step( 0.0031308, x_ )
  );
}
