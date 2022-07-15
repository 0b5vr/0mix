import { GLSLExpression, def, mul, sw, vec4 } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export function calcShadowDepth(
  cameraNearFar: GLSLExpression<'vec2'>,
  distance: GLSLExpression<'float'>,
): GLSLExpression<'vec4'> {
  const depth = def( 'float', glslLinearstep(
    sw( cameraNearFar, 'x' ),
    sw( cameraNearFar, 'y' ),
    distance,
  ) as GLSLExpression<'float'> );
  return vec4( depth, mul( depth, depth ), 0.0, 0.0 );
}
