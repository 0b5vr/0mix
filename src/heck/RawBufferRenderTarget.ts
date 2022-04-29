import { RenderTarget } from './RenderTarget';
import { gl } from '../globals/canvas';
import { glDrawBuffersByNumber } from '../gl/glDrawBuffersByNumber';
import { GL_FRAMEBUFFER } from '../gl/constants';

export interface BufferRenderTargetOptions {
  viewport: [ number, number, number, number ];
  framebuffer: WebGLFramebuffer;
  numBuffers?: number;
}

export class RawBufferRenderTarget extends RenderTarget {
  public static nameMap = new Map<string, RawBufferRenderTarget>();

  public viewport: [ number, number, number, number ];
  public framebuffer: WebGLFramebuffer;
  public numBuffers: number;

  private __name?: string;
  public get name(): string | undefined {
    return this.__name;
  }
  public set name( name: string | undefined ) {
    if ( import.meta.env.DEV ) {
      // remove previous one from the nameMap
      if ( this.__name != null ) {
        RawBufferRenderTarget.nameMap.delete( this.__name );
      }

      this.__name = name;

      // set the current one to the nameMap
      if ( name != null ) {
        if ( RawBufferRenderTarget.nameMap.has( name ) ) {
          console.warn( `Duplicated BufferRenderTarget name, ${ name }` );
          return;
        }

        RawBufferRenderTarget.nameMap.set( name, this );
      } else {
        console.warn( 'BufferRenderTarget without name' );
      }
    }
  }

  public constructor( options: BufferRenderTargetOptions ) {
    super();

    this.framebuffer = options.framebuffer;
    this.viewport = options?.viewport;
    this.numBuffers = options.numBuffers ?? 1;
  }

  public bind(): void {
    gl.bindFramebuffer( GL_FRAMEBUFFER, this.framebuffer );
    glDrawBuffersByNumber( this.numBuffers );
    gl.viewport( ...this.viewport );
  }
}
