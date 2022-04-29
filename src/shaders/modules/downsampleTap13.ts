import { GLSLExpression, vec2 } from '../shaderBuilder';

const WEIGHT_1 = 1.0 / 16.0;
const WEIGHT_2 = 2.0 / 16.0;
const WEIGHT_4 = 4.0 / 16.0;

/**
 * Ref: http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
 */
export function downsampleTap13(
  fn: ( weight: number, offset: GLSLExpression<'vec2'> ) => void
): void {
  fn( WEIGHT_1, vec2( -1.0, -1.0 ) );
  fn( WEIGHT_2, vec2(  0.0, -1.0 ) );
  fn( WEIGHT_1, vec2(  1.0, -1.0 ) );
  fn( WEIGHT_4, vec2( -0.5, -0.5 ) );
  fn( WEIGHT_4, vec2(  0.5, -0.5 ) );
  fn( WEIGHT_2, vec2( -1.0,  0.0 ) );
  fn( WEIGHT_4, vec2(  0.0,  0.0 ) );
  fn( WEIGHT_2, vec2(  1.0,  0.0 ) );
  fn( WEIGHT_4, vec2( -0.5,  0.5 ) );
  fn( WEIGHT_4, vec2(  0.5,  0.5 ) );
  fn( WEIGHT_1, vec2( -1.0,  1.0 ) );
  fn( WEIGHT_2, vec2(  0.0,  1.0 ) );
  fn( WEIGHT_1, vec2(  1.0,  1.0 ) );
}
