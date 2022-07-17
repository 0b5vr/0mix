import { GLTextureFormatStuff } from '../gl/glSetTexture';
import { RawBufferRenderTarget } from './RawBufferRenderTarget';
import { glLazyMipmapFramebuffers } from '../gl/glLazyMipmapFramebuffers';

export class BufferMipmapTextureRenderTarget extends RawBufferRenderTarget {
  public readonly texture: WebGLTexture;
  public readonly mipmapTargets: RawBufferRenderTarget[] | null;

  public constructor(
    width: number,
    height: number,
    levels: number,
    format?: GLTextureFormatStuff,
  ) {
    const { framebuffers, texture } = glLazyMipmapFramebuffers( width, height, levels, format );

    super( {
      viewport: [ 0, 0, width, height ],
      framebuffer: framebuffers[ 0 ],
    } );

    this.texture = texture;

    this.mipmapTargets = framebuffers.map( ( framebuffer ) => {
      const rt = new RawBufferRenderTarget( {
        viewport: [ 0, 0, width, height ],
        framebuffer,
      } );

      width /= 2.0;
      height /= 2.0;

      return rt;
    } );
  }
}
