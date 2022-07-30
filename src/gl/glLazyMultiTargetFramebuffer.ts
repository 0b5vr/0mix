import { GLTextureFormatStuff, GLTextureFormatStuffRGBA32F } from './glSetTexture';
import { GL_CLAMP_TO_EDGE, GL_COLOR_ATTACHMENT0, GL_DEPTH_ATTACHMENT, GL_DEPTH_COMPONENT24, GL_FRAMEBUFFER, GL_LINEAR, GL_RENDERBUFFER, GL_TEXTURE_2D } from './constants';
import { gl } from '../globals/canvas';
import { glCreateTexture } from './glCreateTexture';
import { glTextureFilter } from './glTextureFilter';
import { glTextureWrap } from './glTextureWrap';

export function glLazyMultiTargetFramebuffer(
  width: number,
  height: number,
  numBuffers?: number,
  format?: GLTextureFormatStuff,
): {
  framebuffer: WebGLFramebuffer;
  renderbuffer: WebGLRenderbuffer;
  textures: WebGLTexture[];
} {
  let textures: WebGLTexture[] | undefined;
  const renderbuffer: WebGLRenderbuffer = gl.createRenderbuffer()!;
  const framebuffer: WebGLFramebuffer = gl.createFramebuffer()!;

  try {
    // == renderbuffer =============================================================================
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

    // == texture ==================================================================================
    textures = [ ...Array( numBuffers ?? 1 ) ].map( ( _, i ) => {
      const texture = glCreateTexture(
        width,
        height,
        null,
        format ?? GLTextureFormatStuffRGBA32F,
      );
      glTextureFilter( texture, GL_LINEAR );
      glTextureWrap( texture, GL_CLAMP_TO_EDGE );

      gl.bindFramebuffer( GL_FRAMEBUFFER, framebuffer );
      gl.framebufferTexture2D(
        GL_FRAMEBUFFER, // target
        GL_COLOR_ATTACHMENT0 + i, // attachment
        GL_TEXTURE_2D, // textarget
        texture, // texture
        0, // level
      );
      gl.bindFramebuffer( GL_FRAMEBUFFER, null );

      return texture;
    } );

    // == almost done ==============================================================================
    return { framebuffer, renderbuffer, textures };

  } catch ( e ) {
    textures?.map( ( texture ) => {
      gl.deleteTexture( texture );
    } );
    gl.deleteRenderbuffer( renderbuffer );
    gl.deleteFramebuffer( framebuffer );
    throw e;
  }
}
