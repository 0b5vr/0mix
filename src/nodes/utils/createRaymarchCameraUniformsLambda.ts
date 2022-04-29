import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';

export function createRaymarchCameraUniformsLambda( materials: Material[] ): Lambda {
  const lambda = new Lambda( {
    onDraw: ( event ) => {
      materials.map( ( material ) => {
        material.addUniform(
          'cameraNearFar',
          '2f',
          event.camera.near,
          event.camera.far
        );

        const pvm = mat4Multiply(
          event.projectionMatrix,
          event.viewMatrix,
          event.globalTransform.matrix
        );

        material.addUniformMatrixVector(
          'pvm',
          'Matrix4fv',
          pvm,
        );

        material.addUniformMatrixVector(
          'inversePVM',
          'Matrix4fv',
          mat4Inverse( pvm ),
        );
      } );
    },
  } );

  if ( import.meta.env.DEV ) {
    lambda.name = 'lambdaRaymarchCameraUniforms';
  }

  return lambda;
}
