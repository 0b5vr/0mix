import { BufferRenderTarget } from '../BufferRenderTarget';
import { Component, ComponentOptions } from './Component';
import { RenderTarget } from '../RenderTarget';
import { gl } from '../../globals/canvas';
import { GL_COLOR_ATTACHMENT0, GL_COLOR_BUFFER_BIT, GL_DRAW_FRAMEBUFFER, GL_NEAREST, GL_READ_FRAMEBUFFER } from '../../gl/constants';

export interface BlitOptions extends ComponentOptions {
  src?: BufferRenderTarget;
  dst?: RenderTarget;
  srcRect?: [ number, number, number, number ] | null;
  dstRect?: [ number, number, number, number ] | null;
  attachment?: GLenum;
  mask?: GLenum;
  filter?: GLenum;
}

/**
 * Blit.
 */
export class Blit extends Component {
  public src?: BufferRenderTarget;
  public dst?: RenderTarget;
  public srcRect?: [ number, number, number, number ] | null;
  public dstRect?: [ number, number, number, number ] | null;
  public attachment?: GLenum;
  public mask: GLenum;
  public filter: GLenum;

  public constructor( options: BlitOptions ) {
    super( options );

    this.visible = false;

    this.src = options.src;
    this.dst = options.dst;
    this.srcRect = options.srcRect;
    this.dstRect = options.dstRect;
    this.attachment = options.attachment;
    this.mask = options.mask ?? GL_COLOR_BUFFER_BIT;
    this.filter = options.filter ?? GL_NEAREST;
  }

  protected __updateImpl(): void {
    if ( this.src && this.dst ) {
      gl.bindFramebuffer( GL_READ_FRAMEBUFFER, this.src.framebuffer );
      if ( this.dst instanceof BufferRenderTarget ) {
        gl.bindFramebuffer( GL_DRAW_FRAMEBUFFER, this.dst.framebuffer );
      } else {
        gl.bindFramebuffer( GL_DRAW_FRAMEBUFFER, null );
      }

      gl.readBuffer( this.attachment ?? GL_COLOR_ATTACHMENT0 );
      gl.blitFramebuffer(
        ...( this.srcRect ?? [ 0, 0, this.src.width, this.src.height ] ),
        ...( this.dstRect ?? [ 0, 0, this.dst.width, this.dst.height ] ),
        this.mask,
        this.filter,
      );
    }
  }
}
