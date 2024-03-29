import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { SceneNode } from '../../../heck/components/SceneNode';
import { Swap, arraySerial } from '@0b5vr/experimental';
import { denoiserFrag } from './shaders/denoiserFrag';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface DenoiserOptions {
  shadeTarget: BufferTextureRenderTarget;
  deferredTarget: BufferTextureRenderTarget;
  swap: Swap<BufferTextureRenderTarget>;
  iter: number;
  params: [
    rt: number,
    p: number,
    n: number,
  ];
}

export class Denoiser extends SceneNode {
  public constructor( options: DenoiserOptions ) {
    super();

    const {
      shadeTarget,
      deferredTarget,
      swap,
      iter,
      params,
    } = options;

    // -- quads ------------------------------------------------------------------------------------
    const quads = arraySerial( iter ).map( ( i ) => {
      // :: material :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const material = new Material(
        quadVert,
        denoiserFrag( i ),
        {
          initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
        },
      );
      material.addUniform(
        'sigma',
        '3f',
        ...params,
      );
      material.addUniformTextures(
        'sampler0',
        GL_TEXTURE_2D,
        ...deferredTarget.textures,
      );
      material.addUniformTextures(
        'sampler1',
        GL_TEXTURE_2D,
        i === 0 ? shadeTarget.texture : swap.o.texture,
      );

      if ( import.meta.hot ) {
        import.meta.hot.accept( './shaders/denoiserFrag', ( { denoiserFrag } ) => {
          material.replaceShader( undefined, denoiserFrag( i ) );
        } );
      }

      // :: quad :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const quadDenoiser = new Quad( {
        target: ( i === iter - 1 ) ? shadeTarget : swap.i,
        material: material,
      } );

      if ( import.meta.env.DEV ) {
        quadDenoiser.name = 'quadDenoiser' + i;
      }

      swap.swap();

      return quadDenoiser;
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      ...quads,
    ];
  }
}
