import { GLSLExpression, def, defUniformNamed, sq, sw, vec4 } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

/**
 * Returns `linearstep( near, far, depth )`, and its square.
 * Intended to be used for depth buffer.
 *
 * @param projPos Give me a `vProjPosition`
 * @returns `vec4( depth, depth * depth, 0.0, 0.0 )`
 */
export function calcShadowDepth( projPos: GLSLExpression<'vec4'> ): GLSLExpression<'vec4'> {
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  const depth = def( 'float', glslLinearstep(
    sw( cameraNearFar, 'x' ),
    sw( cameraNearFar, 'y' ),
    sw( projPos, 'w' ),
  ) as GLSLExpression<'float'> );
  return vec4( depth, sq( depth ), 0.0, 0.0 );
}
