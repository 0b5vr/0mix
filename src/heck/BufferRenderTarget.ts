import { RenderTarget } from './RenderTarget';
import { gl } from '../globals/canvas';
import { glLazyDrawbuffers } from '../gl/glLazyDrawbuffers';
import { glLazyMipmapFramebuffers } from '../gl/glLazyMipmapFramebuffers';
import { glDrawBuffersByNumber } from '../gl/glDrawBuffersByNumber';
import { glTextureFilter } from '../gl/glTextureFilter';
import { GL_FRAMEBUFFER } from '../gl/constants';

export interface BufferRenderTargetOptions {
  width: number;
  height: number;
  framebuffer?: WebGLFramebuffer;
  levels?: number;
  numBuffers?: number;
  filter?: GLenum;
  viewport?: [ number, number, number, number ];
}

export class BufferRenderTarget extends RenderTarget {
  public static nameMap = new Map<string, BufferRenderTarget>();

  public viewport: [ number, number, number, number ];
  public readonly framebuffer: WebGLFramebuffer;
  public readonly textures: WebGLTexture[];
  public readonly mipmapTargets: BufferRenderTarget[] | null;
  public readonly numBuffers: number;

  private __name?: string;
  public get name(): string | undefined {
    return this.__name;
  }
  public set name( name: string | undefined ) {
    if ( import.meta.env.DEV ) {
      // remove previous one from the nameMap
      if ( this.__name != null ) {
        BufferRenderTarget.nameMap.delete( this.__name );
      }

      this.__name = name;

      // set the current one to the nameMap
      if ( name != null ) {
        if ( BufferRenderTarget.nameMap.has( name ) ) {
          console.warn( `Duplicated BufferRenderTarget name, ${ name }` );
          return;
        }

        BufferRenderTarget.nameMap.set( name, this );
      } else {
        console.warn( 'BufferRenderTarget without name' );
      }
    }
  }

  public get texture(): WebGLTexture {
    return this.textures[ 0 ];
  }

  public constructor( options: BufferRenderTargetOptions ) {
    super();

    // TODO: stinky branches
    if ( options?.framebuffer != null ) {
      this.framebuffer = options.framebuffer;
      this.mipmapTargets = null;
      this.textures = [];

    } else if ( options?.levels != null ) {
      const { framebuffers, texture } = glLazyMipmapFramebuffers(
        options.width,
        options.height,
        options.levels,
      );

      this.framebuffer = framebuffers[ 0 ];
      this.textures = [ texture ];

      let width = options.width;
      let height = options.height;
      this.mipmapTargets = framebuffers.map( ( framebuffer ) => {
        const rt = new BufferRenderTarget( {
          width,
          height,
          framebuffer,
        } );
        width /= 2.0;
        height /= 2.0;
        return rt;
      } );

    } else {
      const { framebuffer, textures } = glLazyDrawbuffers(
        options.width,
        options.height,
        options.numBuffers ?? 1,
      );
      this.textures = textures;
      this.framebuffer = framebuffer;
      this.mipmapTargets = null;

    }

    this.viewport = options?.viewport ?? [ 0, 0, options.width, options.height ];
    this.numBuffers = options.numBuffers ?? 1;

    if ( options.filter != null ) {
      this.textures.map( ( texture ) => {
        glTextureFilter( texture, options.filter! );
      } );
    }
  }

  public bind(): void {
    gl.bindFramebuffer( GL_FRAMEBUFFER, this.framebuffer );
    glDrawBuffersByNumber( this.numBuffers );
    gl.viewport( ...this.viewport );
  }
}
