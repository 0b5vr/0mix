import { GLSLExpression, glFragCoord, ivec2, sw } from '../shaderBuilder';
import { bayerMatrix4 } from './bayerMatrix4';

export function bayerPattern4( v?: GLSLExpression<'ivec2'> ): GLSLExpression<'float'> {
  v ??= ivec2( sw( glFragCoord, 'xy' ) );
  return `${ bayerMatrix4 }[${ v }.x%4][${ v }.y%4]` as GLSLExpression<'float'>;
}
