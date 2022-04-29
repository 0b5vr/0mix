import { GLSLExpression, def, max, sw } from '../shaderBuilder';

export const maxOfVec2 = ( v: GLSLExpression<'vec2'> ): GLSLExpression<'float'> => {
  const vt = def( 'vec2', v );
  return max( sw( vt, 'x' ), sw( vt, 'y' ) );
};
