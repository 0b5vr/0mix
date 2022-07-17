import { GLTextureFormatStuff } from './glSetTexture';
import { GL_CLAMP_TO_EDGE, GL_COLOR_ATTACHMENT0, GL_DEPTH_ATTACHMENT, GL_DEPTH_COMPONENT24, GL_FRAMEBUFFER, GL_LINEAR, GL_LINEAR_MIPMAP_LINEAR, GL_RENDERBUFFER, GL_RGBA32F, GL_TEXTURE_2D } from './constants';
import { gl } from '../globals/canvas';
import { glTextureFilter } from './glTextureFilter';
import { glTextureWrap } from './glTextureWrap';

export function glLazyMipmapFramebuffers(
  width: number,
  height: number,
  levels: number,
  format?: GLTextureFormatStuff,
): {
  framebuffers: WebGLFramebuffer[];
  renderbuffer: WebGLRenderbuffer;
  texture: WebGLTexture;
} {
  const texture: WebGLTexture = gl.createTexture()!;
  const renderbuffer: WebGLRenderbuffer = gl.createRenderbuffer()!;
  let framebuffers: WebGLFramebuffer[];

  try {
    // == texture ==================================================================================
    glTextureFilter( texture, GL_LINEAR, GL_LINEAR_MIPMAP_LINEAR );
    glTextureWrap( texture, GL_CLAMP_TO_EDGE );

    gl.bindTexture( GL_TEXTURE_2D, texture );
    gl.texStorage2D( GL_TEXTURE_2D, levels, format?.[ 0 ] ?? GL_RGBA32F, width, height );
    gl.bindTexture( GL_TEXTURE_2D, null );

    // == framebuffers =============================================================================
    framebuffers = [ ...Array( levels ) ].map( ( _, i ) => {
      const framebuffer = gl.createFramebuffer()!;

      gl.bindFramebuffer( GL_FRAMEBUFFER, framebuffer );
      gl.framebufferTexture2D(
        GL_FRAMEBUFFER, // target
        GL_COLOR_ATTACHMENT0, // attachment
        GL_TEXTURE_2D, // textarget
        texture, // texture
        i, // level
      );
      gl.bindFramebuffer( GL_FRAMEBUFFER, null );

      if ( i === 0 ) {
        gl.bindRenderbuffer( GL_RENDERBUFFER, renderbuffer );
        gl.renderbufferStorage( GL_RENDERBUFFER, GL_DEPTH_COMPONENT24, width, height );
        gl.bindRenderbuffer( GL_RENDERBUFFER, null );

        gl.bindFramebuffer( GL_FRAMEBUFFER, framebuffer );
        gl.framebufferRenderbuffer(
          GL_FRAMEBUFFER,
          GL_DEPTH_ATTACHMENT,
          GL_RENDERBUFFER,
          renderbuffer,
        );
        gl.bindFramebuffer( GL_FRAMEBUFFER, null );
      }

      return framebuffer;
    } );

    // == almost done ============================================================================
    return { framebuffers, renderbuffer: renderbuffer!, texture };

  } catch ( e ) {
    gl.deleteTexture( texture );
    gl.deleteRenderbuffer( renderbuffer );
    framebuffers?.map( ( framebuffer ) => {
      gl.deleteFramebuffer( framebuffer );
    } );
    throw e;
  }
}
