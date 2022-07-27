import { Blit } from '../../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { kaleidoscopeFrag } from './shaders/kaleidoscopeFrag';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface KaleidoscopeOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class Kaleidoscope extends SceneNode {
  public constructor( options: KaleidoscopeOptions ) {
    super();

    const { input, target } = options;

    // -- dry --------------------------------------------------------------------------------------
    const blitDry = new Blit( {
      src: input,
      dst: target,
    } );

    if ( import.meta.env.DEV ) {
      blitDry.name = 'blitDry';
    }

    // -- materials --------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      kaleidoscopeFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    material.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      input.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/kaleidoscopeFrag', ( { kaleidoscopeFrag } ) => {
        material.replaceShader( quadVert, kaleidoscopeFrag );
      } );
    }

    // -- quads ------------------------------------------------------------------------------------
    const quad = new Quad( { target, material } );

    // -- event listener ---------------------------------------------------------------------------
    auto( 'Kaleidoscope/mode', ( { value } ) => {
      const enable = value > 0.0;

      blitDry.active = !enable;
      quad.active = enable;

      material.addUniform( 'mode', '1f', value );
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      blitDry,
      quad,
    ];
  }
}
