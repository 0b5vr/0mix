import { glLazyMultiTargetFramebuffer } from '../gl/glLazyMultiTargetFramebuffer';
import { GLTextureFormatStuff } from '../gl/glSetTexture';
import { RawBufferRenderTarget } from './RawBufferRenderTarget';

export class BufferTextureRenderTarget extends RawBufferRenderTarget {
  public readonly textures: WebGLTexture[];

  public get texture(): WebGLTexture {
    return this.textures[ 0 ];
  }

  public constructor(
    width: number,
    height: number,
    numBuffers?: number,
    format?: GLTextureFormatStuff,
  ) {
    const { framebuffer, textures } = glLazyMultiTargetFramebuffer(
      width,
      height,
      numBuffers,
      format,
    );

    super( {
      viewport: [ 0, 0, width, height ],
      framebuffer,
      numBuffers,
    } );

    this.textures = textures;
  }
}
