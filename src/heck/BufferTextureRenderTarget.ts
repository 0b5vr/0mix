import { glLazyMultiTargetFramebuffer } from '../gl/glLazyMultiTargetFramebuffer';
import { RawBufferRenderTarget } from './RawBufferRenderTarget';

export class BufferTextureRenderTarget extends RawBufferRenderTarget {
  public readonly textures: WebGLTexture[];

  public get texture(): WebGLTexture {
    return this.textures[ 0 ];
  }

  public constructor( width: number, height: number, numBuffers?: number ) {
    const { framebuffer, textures } = glLazyMultiTargetFramebuffer( width, height, numBuffers );

    super( {
      viewport: [ 0, 0, width, height ],
      framebuffer,
      numBuffers,
    } );

    this.textures = textures;
  }
}
