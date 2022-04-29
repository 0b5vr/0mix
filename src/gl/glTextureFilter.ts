import { gl } from '../globals/canvas';
import { GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_TEXTURE_MIN_FILTER } from './constants';

export function glTextureFilter(
  texture: WebGLTexture,
  mag: number,
  min = mag,
): WebGLTexture {
  gl.bindTexture( GL_TEXTURE_2D, texture );
  gl.texParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, mag );
  gl.texParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, min );
  gl.bindTexture( GL_TEXTURE_2D, null );

  return texture;
}
