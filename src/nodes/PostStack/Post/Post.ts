import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { postFrag } from './shaders/postFrag';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';
import { randomTexture } from '../../../globals/randomTexture';

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

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/postFrag', ( { postFrag } ) => {
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

    this.children = [ quad ];

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Post/cos', ( { value } ) => material.addUniform( 'cosAmp', '1f', value ) );
    auto( 'Post/colorGrade', ( { value } ) => material.addUniform( 'colorGrade', '1f', value ) );
  }
}
