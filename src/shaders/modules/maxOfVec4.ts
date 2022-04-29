import { GLSLExpression, def, max, sw } from '../shaderBuilder';

export const maxOfVec4 = ( v: GLSLExpression<'vec4'> ): GLSLExpression<'float'> => {
  const vt = def( 'vec4', v );
  return max( max( sw( vt, 'x' ), sw( vt, 'y' ) ), max( sw( vt, 'z' ), sw( vt, 'w' ) ) );
};
