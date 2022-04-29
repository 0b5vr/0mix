import { GLSLExpression, GLSLFloatExpression, assign, def, mix, mul } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export const glslGradient = (
  x: GLSLFloatExpression,
  points: GLSLExpression<'vec3'>[],
): GLSLExpression<'vec3'> => {
  const result = def( 'vec3' );
  let prevPoint: GLSLExpression<'vec3'> | undefined;
  const xt = mul( x, points.length - 1.0 );
  points.map( ( point, i ) => {
    if ( prevPoint ) {
      assign( result, mix( prevPoint, point, glslLinearstep( i - 1.0, i, xt ) ) );
      prevPoint = result;
    } else {
      prevPoint = point;
    }
  } );
  return result;
};
