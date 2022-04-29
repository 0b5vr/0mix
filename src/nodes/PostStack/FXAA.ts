import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { fxaaFrag } from './shaders/fxaaFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { GL_TEXTURE_2D } from '../../gl/constants';

export interface FXAAOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class FXAA extends SceneNode {
  public constructor( options: FXAAOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      fxaaFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, options.input.texture );

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept( './shaders/fxaaFrag', ( { fxaaFrag } ) => {
        material.replaceShader( quadVert, fxaaFrag );
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
