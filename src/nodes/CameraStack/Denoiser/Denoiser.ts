import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { DenoiserResources } from './DenoiserResources';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { SceneNode } from '../../../heck/components/SceneNode';
import { denoiserFrag } from './shaders/denoiserFrag';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface DenoiserOptions {
  shadeTarget: BufferTextureRenderTarget;
  deferredTarget: BufferTextureRenderTarget;
  resources: DenoiserResources;
}

export class Denoiser extends SceneNode {
  public resources: DenoiserResources;

  public constructor( options: DenoiserOptions ) {
    super();

    const {
      shadeTarget,
      deferredTarget,
      resources,
    } = options;

    // -- buffers ----------------------------------------------------------------------------------
    const [
      swap,
    ] = this.resources = resources;

    // -- quads ------------------------------------------------------------------------------------
    const quads = [ ...Array( 4 ) ].map( ( _, i ) => {
      // :: material :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const material = new Material(
        quadVert,
        denoiserFrag( i ),
        {
          initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
        },
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
        target: i === 3 ? shadeTarget : swap.i,
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
