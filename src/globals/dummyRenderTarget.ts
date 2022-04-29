import { BufferRenderTarget } from '../heck/BufferRenderTarget';

export const dummyRenderTarget1 = new BufferRenderTarget( {
  width: 1,
  height: 1,
} );

export const dummyRenderTarget2 = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 2,
} );


export const dummyRenderTarget4 = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 4,
} );

if ( import.meta.env.DEV ) {
  dummyRenderTarget1.name = 'dummyRenderTarget1';
  dummyRenderTarget2.name = 'dummyRenderTarget2';
  dummyRenderTarget4.name = 'dummyRenderTarget4';
}
