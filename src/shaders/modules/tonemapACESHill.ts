import { GLSLExpression, add, div, mat3, mul, sub } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

/*!
 * The ACES tone mapping part is taken from Baking Lab
 * (c) MJP and David Neubelt, MIT License
 *
 * https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl
 *
 * The original fit was done by Stephen Hill (@self_shadow)
 */

const ACESInputMat = mat3(
  0.59719, 0.07600, 0.02840,
  0.35458, 0.90834, 0.13383,
  0.04823, 0.01566, 0.83777,
);

const ACESOutputMat = mat3(
  1.60475, -0.10208, -0.00327,
  -0.53108, 1.10813, -0.07276,
  -0.07367, -0.00605, 1.07602,
);

function RRTAndODTFit( v: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const a = sub( mul( v, add( v, 0.0245786 ) ), 0.000090537 );
  const b = add( mul( v, add( mul( 0.983729, v ), 0.4329510 ) ), 0.238081 );
  return div( a, b );
}

export function tonemapACESHill(
  sRGB: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const input = mul( ACESInputMat, sRGB );
  const fitted = RRTAndODTFit( input );
  const output = mul( ACESOutputMat, fitted );
  return glslSaturate( output );
}
