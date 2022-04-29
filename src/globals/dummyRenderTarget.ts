import { BufferTextureRenderTarget } from '../heck/BufferTextureRenderTarget';

export const dummyRenderTarget1 = new BufferTextureRenderTarget( 1, 1 );
export const dummyRenderTarget2 = new BufferTextureRenderTarget( 1, 1, 2 );
export const dummyRenderTarget4 = new BufferTextureRenderTarget( 1, 1, 4 );

if ( import.meta.env.DEV ) {
  dummyRenderTarget1.name = 'dummyRenderTarget1';
  dummyRenderTarget2.name = 'dummyRenderTarget2';
  dummyRenderTarget4.name = 'dummyRenderTarget4';
}
