import { GLSLExpression, abs, add, addAssign, assign, def, div, dot, log2, max, mix, mul, mulAssign, pow, step, sub, sw, vec3, vec4 } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';

const LUMA = vec3( 0.2126, 0.7152, 0.0722 );

/**
 * DaVinci Resolve style color grading function
 */
export function liftGammaGain(
  rgb: GLSLExpression<'vec3'>,
  lift: GLSLExpression<'vec4'>,
  gamma: GLSLExpression<'vec4'>,
  gain: GLSLExpression<'vec4'>,
): GLSLExpression<'vec3'> {
  const liftt = def( 'vec4', (
    sub( 1.0, pow( sub( 1.0, lift ), log2( add( gain, 1.0 ) ) ) )
  ) );

  const gammat = def( 'vec4', (
    sub( gamma, vec4( 0.0, 0.0, 0.0, dot( vec4( LUMA, 0.0 ), gamma ) ) )
  ) );
  const gammatTemp = add( 1.0, mul( 4.0, abs( gammat ) ) );
  assign( gammat, mix( gammatTemp, div( 1.0, gammatTemp ), step( 0.0, gammat ) ) );

  const col = def( 'vec3', rgb );
  const luma = def( 'float', dot( LUMA, col ) );

  assign( col, pow( col, sw( gammat, 'rgb' ) ) );
  mulAssign( col, pow( sw( gain, 'rgb' ), sw( gammat, 'rgb' ) ) );
  assign(
    col,
    max( mix( mul( 2.0, sw( liftt, 'rgb' ) ), vec3( 1.0 ), col ), 0.0 )
  );

  assign( luma, pow( luma, sw( gammat, 'a' ) ) );
  mulAssign( luma, pow( sw( gain, 'a' ), sw( gammat, 'a' ) ) );
  assign( luma, max( mix( mul( 2.0, sw( liftt, 'a' ) ), 1.0, luma ), 0.0 ) );

  addAssign( col, sub( luma, dot( LUMA, col ) ) );

  return glslSaturate( col );
}
