import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { mixerFrag } from './shaders/mixerFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

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
