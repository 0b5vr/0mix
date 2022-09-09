import { GLSLExpression, def, defUniformNamed, mul, sw, vec4 } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export function calcShadowDepth( distance: GLSLExpression<'float'> ): GLSLExpression<'vec4'> {
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  const depth = def( 'float', glslLinearstep(
    sw( cameraNearFar, 'x' ),
    sw( cameraNearFar, 'y' ),
    distance,
  ) as GLSLExpression<'float'> );
  return vec4( depth, mul( depth, depth ), 0.0, 0.0 );
}
