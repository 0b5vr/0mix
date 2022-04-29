import { Bloom } from './Bloom';
import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { ComponentOptions } from '../../heck/components/Component';
import { FXAA } from './FXAA';
import { Post } from './Post';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';

export interface PostStackOptions extends ComponentOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class PostStack extends SceneNode {
  public swap: Swap<BufferRenderTarget>;

  public constructor( options: PostStackOptions ) {
    super( options );

    const { input, target } = options;

    // -- swap -------------------------------------------------------------------------------------
    const swapOptions = {
      width: target.width,
      height: target.height,
    };

    const postSwap = this.swap = new Swap(
      new BufferRenderTarget( swapOptions ),
      new BufferRenderTarget( swapOptions ),
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
