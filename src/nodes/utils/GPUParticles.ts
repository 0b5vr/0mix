import { Geometry } from '../../heck/Geometry';
import { Lambda } from '../../heck/components/Lambda';
import { Material, MaterialMap } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../gl/constants';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';

export interface GPUParticlesOptions extends SceneNodeOptions {
  materialCompute: Material;
  geometryRender: Geometry;
  materialsRender: MaterialMap;
  computeWidth: number;
  computeHeight: number;
  computeNumBuffers: number;
}

export class GPUParticles extends SceneNode {
  public meshRender: Mesh;

  public constructor( options: GPUParticlesOptions ) {
    super( options );

    const {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth,
      computeHeight,
      computeNumBuffers,
    } = options;

    const swapCompute = new Swap(
      new BufferTextureRenderTarget( computeWidth, computeHeight, computeNumBuffers ),
      new BufferTextureRenderTarget( computeWidth, computeHeight, computeNumBuffers ),
    );

    glTextureFilter( swapCompute.i.texture, GL_NEAREST );
    glTextureFilter( swapCompute.o.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      swapCompute.i.name = `${ this.name }/swap0`;
      swapCompute.o.name = `${ this.name }/swap1`;
    }

    // -- compute ----------------------------------------------------------------------------------
    const quadCompute = new Quad( {
      target: swapCompute.o,
      material: materialCompute,
    } );

    if ( import.meta.env.DEV ) {
      quadCompute.name = 'quadCompute';
    }

    // -- render -----------------------------------------------------------------------------------
    this.meshRender = new Mesh( {
      geometry: geometryRender,
      materials: materialsRender,
    } );

    if ( import.meta.env.DEV ) {
      this.meshRender.name = 'meshRender';
    }

    Object.values( materialsRender ).map( ( material ) => {
      material?.addUniform(
        'resolutionCompute',
        '2f',
        computeWidth,
        computeHeight
      );
    } );

    // -- swapper ----------------------------------------------------------------------------------
    const swapper = new Lambda( {
      onUpdate: () => {
        swapCompute.swap();

        for ( let i = 0; i < computeNumBuffers; i ++ ) {
          materialCompute.addUniformTextures(
            `samplerCompute${ i }`,
            GL_TEXTURE_2D,
            swapCompute.i.textures[ i ],
          );

          Object.values( materialsRender ).map( ( material ) => {
            material?.addUniformTextures(
              `samplerCompute${ i }`,
              GL_TEXTURE_2D,
              swapCompute.o.textures[ i ],
            );
          } );
        }

        quadCompute.target = swapCompute.o;
      },
    } );

    if ( import.meta.env.DEV ) {
      swapper.name = 'swapper';
    }

    // -- rest of components -----------------------------------------------------------------------
    this.children.push(
      swapper,
      quadCompute,
      this.meshRender,
    );
  }
}
