import { CubemapNode } from '../CubemapNode/CubemapNode';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { ibllutTexture } from '../../globals/ibllutCalc';

export function createCubemapUniformsLambda(
  cubemapNode: CubemapNode,
  materials: Material[],
): Lambda {
  const lambda = (): void => {
    materials.map( ( material ) => {
      material.addUniformTextures( 'samplerIBLLUT', GL_TEXTURE_2D, ibllutTexture );

      material.addUniformTextures(
        'samplerEnvDry',
        GL_TEXTURE_2D,
        cubemapNode.targetDry.texture,
      );
      material.addUniformTextures(
        'samplerEnvWet',
        GL_TEXTURE_2D,
        cubemapNode.targetWet.texture,
      );
    } );
  };

  return new Lambda( {
    onUpdate: lambda,
    onDraw: lambda,
  } );
}
