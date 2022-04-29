import { GLSLExpression, def, max, sw } from '../shaderBuilder';

export const maxOfVec3 = ( v: GLSLExpression<'vec3'> ): GLSLExpression<'float'> => {
  const vt = def( 'vec3', v );
  return max( sw( vt, 'x' ), max( sw( vt, 'y' ), sw( vt, 'z' ) ) );
};
