import { GLTextureFormatStuff, GLTextureFormatStuffRGBA32F, glSetTexture } from '../gl/glSetTexture';
import { GL_DEPTH_COMPONENT24, GL_RENDERBUFFER } from '../gl/constants';
import { RawBufferRenderTarget } from './RawBufferRenderTarget';
import { gl } from '../globals/canvas';
import { glLazyMultiTargetFramebuffer } from '../gl/glLazyMultiTargetFramebuffer';

export class BufferTextureRenderTarget extends RawBufferRenderTarget {
  public textures: WebGLTexture[];
  public renderbuffer: WebGLRenderbuffer;
  public format: GLTextureFormatStuff;

  public get texture(): WebGLTexture {
    return this.textures[ 0 ];
  }

  public constructor(
    width: number,
    height: number,
    numBuffers?: number,
    format: GLTextureFormatStuff = GLTextureFormatStuffRGBA32F,
  ) {
    const { framebuffer, renderbuffer, textures } = glLazyMultiTargetFramebuffer(
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

    this.renderbuffer = renderbuffer;
    this.textures = textures;
    this.format = format;
  }

  /**
   * Resize the framebuffer.
   * This also modifies the viewport.
   */
  public resize(
    width: number,
    height: number,
  ): void {
    gl.bindRenderbuffer( GL_RENDERBUFFER, this.renderbuffer );
    gl.renderbufferStorage( GL_RENDERBUFFER, GL_DEPTH_COMPONENT24, width, height );
    gl.bindRenderbuffer( GL_RENDERBUFFER, null );

    this.textures.map( ( texture ) => {
      glSetTexture( texture, width, height, null, this.format );
    } );

    this.viewport = [ 0, 0, width, height ];
  }
}
