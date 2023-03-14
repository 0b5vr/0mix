import { Component } from '../../heck/components/Component';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { forwardPBRColorFrag } from '../../shaders/common/forwardPBRColorFrag';
import { genCube } from '../../geometries/genCube';
import { ibllutObservers } from '../../globals/globalObservers';
import { objectVert } from '../../shaders/common/objectVert';
import { zeroTexture } from '../../globals/zeroTexture';

export interface TransparentShellOptions extends SceneNodeOptions {
  baseColor?: [ number, number, number ];
  roughness?: number;
  roughnessNoise?: number;
  metallic?: number;
  opacity?: number;
  insideChildren?: Component[];
  cubemapNode?: CubemapNode;
}

export class TransparentShell extends SceneNode {
  public constructor( options?: TransparentShellOptions ) {
    super( options );

    const {
      baseColor,
      roughness,
      roughnessNoise,
      metallic,
      opacity,
      insideChildren,
      cubemapNode,
    } = options ?? {};

    // -- shell ------------------------------------------------------------------------------------
    const geometryShellFront = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );
    const geometryShellBack = genCube( { dimension: [ -0.5, -0.5, -0.5 ] } );

    const forwardShell = new Material(
      objectVert,
      forwardPBRColorFrag,
      {
        initOptions: { geometry: geometryShellFront, target: dummyRenderTarget1 },
        blend: [ GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );
    forwardShell.addUniform( 'baseColor', '3f', ...( baseColor ?? [ 1.0, 1.0, 1.0 ] ) );
    forwardShell.addUniform( 'roughness', '1f', roughness ?? 0.1 );
    forwardShell.addUniform( 'roughnessNoise', '1f', roughnessNoise ?? 0.1 );
    forwardShell.addUniform( 'metallic', '1f', metallic ?? 0.0 );
    forwardShell.addUniform( 'opacity', '1f', opacity ?? 0.01 );

    forwardShell.addUniformTextures(
      'samplerEnvDry',
      GL_TEXTURE_2D,
      cubemapNode?.targetDry?.texture ?? zeroTexture,
    );
    forwardShell.addUniformTextures(
      'samplerEnvWet',
      GL_TEXTURE_2D,
      cubemapNode?.targetWet?.texture ?? zeroTexture,
    );

    const meshShellFront = new Mesh( {
      geometry: geometryShellFront,
      materials: { forward: forwardShell },
    } );
    meshShellFront.depthWrite = false;

    const meshShellBack = new Mesh( {
      geometry: geometryShellBack,
      materials: { forward: forwardShell },
    } );
    meshShellBack.depthWrite = false;

    // -- receive stuff ----------------------------------------------------------------------------
    const lightUniformsLambda = createLightUniformsLambda( [ forwardShell ] );

    // -- event listeners --------------------------------------------------------------------------
    ibllutObservers.push( ( ibllutTexture ) => {
      forwardShell.addUniformTextures(
        'samplerIBLLUT',
        GL_TEXTURE_2D,
        ibllutTexture,
      );
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lightUniformsLambda,
      meshShellBack,
      ...( insideChildren ?? [] ),
      meshShellFront,
    ];

    if ( import.meta.env.DEV ) {
      lightUniformsLambda.name = 'lightUniformsLambda';
      meshShellBack.name = 'meshShellBack';
      meshShellFront.name = 'meshShellFront';
    }
  }
}
