import { Bloom } from './Bloom';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { ComponentOptions } from '../../heck/components/Component';
import { FXAA } from './FXAA';
import { Post } from './Post';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';

export interface PostStackOptions extends ComponentOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class PostStack extends SceneNode {
  public swap: Swap<RawBufferRenderTarget>;

  public constructor( options: PostStackOptions ) {
    super( options );

    const { input, target } = options;

    // -- swap -------------------------------------------------------------------------------------
    const postSwap = this.swap = new Swap(
      new BufferTextureRenderTarget( target.width, target.height ),
      new BufferTextureRenderTarget( target.width, target.height ),
    );

    if ( import.meta.env.DEV ) {
      postSwap.i.name = `${ this.name }/postSwap0`;
      postSwap.o.name = `${ this.name }/postSwap1`;
    }

    // -- post -------------------------------------------------------------------------------------
    postSwap.swap();
    const bloom = new Bloom( {
      input,
      target: postSwap.i,
    } );

    postSwap.swap();
    const post = new Post( {
      input: postSwap.o,
      target: postSwap.i,
    } );

    postSwap.swap();
    const fxaa = new FXAA( {
      input: postSwap.o,
      target,
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      bloom,
      post,
      fxaa,
    ];
  }
}
