import { GLSLExpression, def, defUniformNamed, sq, sw, vec4 } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export function calcShadowDepth( projPos: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'> {
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  const depth = def( 'float', glslLinearstep(
    sw( cameraNearFar, 'x' ),
    sw( cameraNearFar, 'y' ),
    sw( projPos, 'w' ),
  ) as GLSLExpression<'float'> );
  return vec4( depth, sq( depth ), 0.0, 0.0 );
}
