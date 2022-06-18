import { Bloom } from './Bloom';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { ComponentOptions } from '../../heck/components/Component';
import { Post } from './Post';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { DoF } from './DoF/DoF';
import { Code } from './Code/Code';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';

export interface PostStackOptions extends ComponentOptions {
  input: BufferTextureRenderTarget;
  deferredCamera: PerspectiveCamera;
  deferredTarget: BufferTextureRenderTarget;
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
    const dof = new DoF( {
      input,
      deferredCamera: options.deferredCamera,
      deferredTarget: options.deferredTarget,
      target: postSwap.i,
    } );

    const code = new Code( { target: postSwap.i } );

    postSwap.swap();
    const bloom = new Bloom( {
      input: postSwap.o,
      target: postSwap.i,
    } );

    postSwap.swap();
    const post = new Post( {
      input: postSwap.o,
      // target: postSwap.i,
      target,
    } );

    // postSwap.swap();
    // const fxaa = new FXAA( {
    //   input: postSwap.o,
    //   target,
    // } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      dof,
      code,
      bloom,
      post,
      // fxaa,
    ];
  }
}
