import { RenderTarget } from './RenderTarget';
import { gl } from '../globals/canvas';
import { GL_BACK, GL_FRAMEBUFFER } from '../gl/constants';

export interface RawBufferRenderTargetOptions {
  framebuffer: WebGLFramebuffer;
  viewport: [ number, number, number, number ];
  attachment?: number | GLenum[];
}

export class RawBufferRenderTarget extends RenderTarget {
  public viewport: [ number, number, number, number ];
  public attachment: number | GLenum[];
  public framebuffer: WebGLFramebuffer;

  public constructor( options: RawBufferRenderTargetOptions ) {
    super();

    this.framebuffer = options.framebuffer;
    this.viewport = options.viewport;
    this.attachment = options.attachment ?? [ GL_BACK ];
  }

  public bind(): void {
    gl.bindFramebuffer( GL_FRAMEBUFFER, this.framebuffer );
    gl.drawBuffers( this.viewport );
    gl.viewport( ...this.viewport );
  }
}
