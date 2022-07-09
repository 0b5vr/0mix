import { GL_TEXTURE_2D } from '../../gl/constants';
import { auto } from '../../globals/automaton';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Material } from '../../heck/Material';
import { RenderTarget } from '../../heck/RenderTarget';
import { quadVert } from '../../shaders/common/quadVert';
import { mixerFrag } from './shaders/mixerFrag';

export interface MixerOptions extends SceneNodeOptions {
  inputA: BufferTextureRenderTarget;
  inputB: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class Mixer extends SceneNode {
  public constructor( { inputA, inputB, target }: MixerOptions ) {
    super();

    const material = new Material(
      quadVert,
      mixerFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, inputA.texture );
    material.addUniformTextures( 'sampler1', GL_TEXTURE_2D, inputB.texture );

    auto( 'Mixer/blendAdd', ( { value } ) => material.addUniform( 'blendAdd', '1f', value ) );
    auto( 'Mixer/blendMix', ( { value } ) => material.addUniform( 'blendMix', '1f', value ) );

    const quadMixer = new Quad( {
      target,
      material,
    } );

    this.children = [ quadMixer ];
  }
}
