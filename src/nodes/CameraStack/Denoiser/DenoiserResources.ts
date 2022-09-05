import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffRGBA16F } from '../../../gl/glSetTexture';
import { Swap } from '@0b5vr/experimental';

export type DenoiserResources = [
  swap: Swap<BufferTextureRenderTarget>,
];

export function createDenoiserResources(): DenoiserResources {
  const swap = new Swap(
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F ),
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F ),
  );

  if ( import.meta.env.DEV ) {
    swap.i.name = 'Denoiser/swap/0';
    swap.o.name = 'Denoiser/swap/1';
  }

  return [ swap ];
}

export function resizeDenoiserResources(
  [ swap ]: DenoiserResources,
  width: number,
  height: number,
): void {
  swap.i.resize( width, height );
  swap.o.resize( width, height );
}
