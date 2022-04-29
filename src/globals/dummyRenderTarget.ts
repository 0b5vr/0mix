import { BufferRenderTarget } from '../heck/BufferRenderTarget';

export const dummyRenderTarget = new BufferRenderTarget( {
  width: 1,
  height: 1,
} );

export const dummyRenderTargetTwoDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 2,
} );


export const dummyRenderTargetFourDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 4,
} );

if ( import.meta.env.DEV ) {
  dummyRenderTarget.name = 'dummyRenderTarget';
  dummyRenderTargetTwoDrawBuffers.name = 'dummyRenderTargetTwoDrawBuffers';
  dummyRenderTargetFourDrawBuffers.name = 'dummyRenderTargetFourDrawBuffers';
}
