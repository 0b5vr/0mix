import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { RawVector3 } from '@0b5vr/experimental';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { createLightUniformsLambda } from './createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './createRaymarchCameraUniformsLambda';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { objectVert } from '../../shaders/common/objectVert';
import { randomTexture } from '../../globals/randomTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';

export interface RaymarcherNodeOptions extends SceneNodeOptions {
  dimension?: RawVector3;
}

export class RaymarcherNode extends SceneNode {
  public materials: {
    deferred: Material,
    depth: Material,
  };

  public constructor(
    builder: ( tag: 'deferred' | 'depth' ) => string,
    options?: RaymarcherNodeOptions,
  ) {
    super( options );

    // -- render -----------------------------------------------------------------------------------
    const { geometry } = genCube( { dimension: options?.dimension ?? [ 0.55, 0.55, 0.55 ] } );

    const deferred = new Material(
      objectVert,
      builder( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );
    deferred.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    const depth = new Material(
      objectVert,
      builder( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );
    depth.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    const lambdaLightUniforms = createLightUniformsLambda( [
      deferred,
    ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      deferred,
      depth,
    ] );

    const materials = this.materials = { depth, deferred };

    const mesh = new Mesh( {
      geometry,
      materials,
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      mesh,
    ];

    // -- done ---------------------------------------------------------------------------------------
    return this;
  }

  public forEachMaterials( fn: ( material: Material ) => void ): void {
    Object.values( this.materials ).map( ( material ) => fn( material ) );
  }
}
