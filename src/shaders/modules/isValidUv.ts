import { GLSLExpression, and, gt, lt, sw } from '../shaderBuilder';

export const isValidUv = ( v: GLSLExpression<'vec2'> ): GLSLExpression<'bool'> => {
  return and(
    gt( sw( v, 'x' ), 0.0 ),
    lt( sw( v, 'x' ), 1.0 ),
    gt( sw( v, 'y' ), 0.0 ),
    lt( sw( v, 'y' ), 1.0 ),
  );
};
