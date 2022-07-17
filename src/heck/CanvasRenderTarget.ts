import { GL_BACK, GL_FRAMEBUFFER } from '../gl/constants';
import { RenderTarget } from './RenderTarget';
import { canvas, gl } from '../globals/canvas';

export interface CanvasRenderTargetOptions {
  viewport?: [ number, number, number, number ];
}

export class CanvasRenderTarget extends RenderTarget {
  public viewport: [ number, number, number, number ];

  public constructor( options?: CanvasRenderTargetOptions ) {
    super();

    this.viewport = options?.viewport ?? [ 0, 0, canvas.width, canvas.height ];
  }

  public bind(): void {
    gl.bindFramebuffer( GL_FRAMEBUFFER, null );
    gl.drawBuffers( [ GL_BACK ] );
    gl.viewport( ...this.viewport );
  }
}
