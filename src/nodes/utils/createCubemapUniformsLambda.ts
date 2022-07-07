import { Component } from '../../heck/components/Component';
import { CubemapNode, CubemapNodeTag } from '../CubemapNode/CubemapNode';
import { IBLLUTCalc, IBLLUTCalcTag } from '../IBLLUTCalc/IBLLUTCalc';
import { Lambda } from '../../heck/components/Lambda';
import { MapOfSet } from '../../utils/MapOfSet';
import { Material } from '../../heck/Material';
import { GL_TEXTURE_2D } from '../../gl/constants';

export function createCubemapUniformsLambda( materials: Material[] ): Lambda {
  const setCubemapUniforms = ( { componentsByTag }: {
    componentsByTag: MapOfSet<symbol, Component>,
  } ): void => {
    const cubemapNode = Array.from(
      componentsByTag.get( CubemapNodeTag )
    )[ 0 ] as CubemapNode | undefined;
    const ibllutCalc = Array.from(
      componentsByTag.get( IBLLUTCalcTag )
    )[ 0 ] as IBLLUTCalc | undefined;

    materials.map( ( material ) => {
      if ( ibllutCalc ) {
        material.addUniformTextures( 'samplerIBLLUT', GL_TEXTURE_2D, ibllutCalc.texture );
      }

      if ( cubemapNode ) {
        material.addUniformTextures(
          'samplerEnvDry',
          GL_TEXTURE_2D,
          cubemapNode.targetDry.texture
        );
        material.addUniformTextures(
          'samplerEnvWet',
          GL_TEXTURE_2D,
          cubemapNode.targetWet.texture
        );
      }
    } );
  };

  const lambda = new Lambda( {
    onUpdate: setCubemapUniforms,
    onDraw: setCubemapUniforms,
  } );

  if ( import.meta.env.DEV ) {
    lambda.name = 'lambdaCubemapUniforms';
  }

  return lambda;
}
