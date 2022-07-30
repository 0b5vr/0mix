import { BufferTextureRenderTarget } from '../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffRG16F } from '../gl/glSetTexture';
import { Swap } from '@0b5vr/experimental';

const SHADOW_MAP_SIZE = 1024;

export const swapShadowMap1 = new Swap(
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
);

export const swapShadowMap2 = new Swap(
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
);

export const swapShadowMap3 = new Swap(
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
  new BufferTextureRenderTarget( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 1, GLTextureFormatStuffRG16F ),
);

if ( import.meta.env.DEV ) {
  swapShadowMap1.i.name = 'swapShadowMap1/0';
  swapShadowMap1.o.name = 'swapShadowMap1/1';
  swapShadowMap2.i.name = 'swapShadowMap2/0';
  swapShadowMap2.o.name = 'swapShadowMap2/1';
  swapShadowMap3.i.name = 'swapShadowMap3/0';
  swapShadowMap3.o.name = 'swapShadowMap3/1';
}
