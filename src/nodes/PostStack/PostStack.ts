import { Bloom } from './Bloom/Bloom';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Code } from './Code';
import { ComponentOptions } from '../../heck/components/Component';
import { DCT } from './DCT/DCT';
import { FUIShit } from './FUIShit/FUIShit';
import { FXAA } from './FXAA/FXAA';
import { Kaleidoscope } from './Kaleidoscope/Kaleidoscope';
import { PixelSorter } from './PixelSorter/PixelSorter';
import { Post } from './Post/Post';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { StatsText } from './StatsText';
import { Swap } from '@0b5vr/experimental';
import { Vectorscope } from './Vectorscope/Vectorscope';
import { resizeObservers } from '../../globals/globalObservers';

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

    resizeObservers.push( ( [ width, height ] ) => {
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
    const fxaa = new FXAA( {
      input: swap.o,
      target: swap.i,
    } );

    const fuiShit = new FUIShit( {
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
    } );

    swap.swap();
    const dct = new DCT( {
      input: swap.o,
      target: swap.i,
    } );

    swap.swap();
    const pixelSorter = new PixelSorter( {
      input: swap.o,
      // target: swap.i,
      target,
    } );

    const code = new Code( target );
    const vectorscope = new Vectorscope( target );
    const statsText = new StatsText( target );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      bloom,
      fxaa,
      fuiShit,
      kaleidoscope,
      post,
      dct,
      pixelSorter,
      code,
      vectorscope,
      statsText,
    ];
  }
}
