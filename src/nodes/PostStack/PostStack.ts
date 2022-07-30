import { Bloom } from './Bloom/Bloom';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Code } from './Code/Code';
import { ComponentOptions } from '../../heck/components/Component';
import { DCT } from './DCT/DCT';
import { EventType, on } from '../../globals/globalEvent';
import { FXAA } from './FXAA/FXAA';
import { Kaleidoscope } from './Kaleidoscope/Kaleidoscope';
import { Post } from './Post/Post';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';

export interface PostStackOptions extends ComponentOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class PostStack extends SceneNode {
  public swap: Swap<BufferTextureRenderTarget>;

  public constructor( options: PostStackOptions ) {
    super( options );

    const { input, target } = options;

    // -- swap -------------------------------------------------------------------------------------
    const swap = this.swap = new Swap(
      new BufferTextureRenderTarget( 4, 4 ),
      new BufferTextureRenderTarget( 4, 4 ),
    );

    on( EventType.Resize, ( [ width, height ] ) => {
      swap.i.resize( width, height );
      swap.o.resize( width, height );
    } );

    if ( import.meta.env.DEV ) {
      swap.i.name = `${ this.name }/postSwap0`;
      swap.o.name = `${ this.name }/postSwap1`;
    }

    // -- post -------------------------------------------------------------------------------------
    swap.swap();
    const bloom = new Bloom( {
      input,
      target: swap.i,
    } );

    swap.swap();
    const kaleidoscope = new Kaleidoscope( {
      input: swap.o,
      target: swap.i,
    } );

    swap.swap();
    const post = new Post( {
      input: swap.o,
      target: swap.i,
      // target,
    } );

    swap.swap();
    const fxaa = new FXAA( {
      input: swap.o,
      target: swap.i,
    } );

    swap.swap();
    const dct = new DCT( {
      input: swap.o,
      // target: postSwap.i,
      target,
    } );

    const code = new Code( { target } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      bloom,
      kaleidoscope,
      post,
      fxaa,
      dct,
      code,
    ];
  }
}
