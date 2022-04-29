import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { postFrag } from './shaders/postFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture } from '../../globals/randomTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';

export interface PostOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class Post extends SceneNode {
  public constructor( options: PostOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      postFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, options.input.texture );
    material.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept( './shaders/postFrag', ( { postFrag } ) => {
        material.replaceShader( quadVert, postFrag );
      } );
    }

    const quad = new Quad( {
      target: options.target,
      material,
    } );

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    this.children.push( quad );
  }
}
