import { GLSLExpression, add, div, mul } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

/*!
 * The ACES tone mapping part is taken from Krzysztof Narkowicz's blog
 *
 * https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
 */

export function tonemapACESNarkowicz(
  x: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  return glslSaturate( div(
    mul( x, add( mul( 0.45, x ), 0.02 ) ),
    add( mul( x, add( mul( 0.45, x ), 0.07 ) ), 0.2 ),
  ) ) as GLSLExpression<'vec3'>;
}
