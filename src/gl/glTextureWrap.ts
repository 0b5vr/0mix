import { gl } from '../globals/canvas';
import { GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_TEXTURE_WRAP_T } from './constants';
import { GLTextureWrapType } from './GLTextureWrapType';

export function glTextureWrap(
  texture: WebGLTexture,
  wrap: GLTextureWrapType,
): WebGLTexture {
  gl.bindTexture( GL_TEXTURE_2D, texture );
  gl.texParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, wrap );
  gl.texParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, wrap );
  gl.bindTexture( GL_TEXTURE_2D, null );

  return texture;
}
