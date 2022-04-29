import { gl } from '../globals/canvas';
import { GL_FLOAT, GL_RGBA, GL_RGBA32F, GL_RGBA8, GL_TEXTURE_2D, GL_UNSIGNED_BYTE } from './constants';

export type GLTextureFormatStuff = [
  internalformat: number,
  format: number,
  type: number,
];

export const GLTextureFormatStuffRGBA8: GLTextureFormatStuff = [
  GL_RGBA8,
  GL_RGBA,
  GL_UNSIGNED_BYTE,
];

export const GLTextureFormatStuffRGBA32F: GLTextureFormatStuff = [
  GL_RGBA32F,
  GL_RGBA,
  GL_FLOAT,
];

export function glSetTexture(
  texture: WebGLTexture,
  width: number,
  height: number,
  source: ArrayBufferView | null,
  formatstuff: GLTextureFormatStuff = GLTextureFormatStuffRGBA8,
): WebGLTexture {
  gl.bindTexture( GL_TEXTURE_2D, texture );
  gl.texImage2D(
    GL_TEXTURE_2D, // target
    0, // level
    formatstuff[ 0 ], // internalformat
    width,
    height,
    0, // border
    formatstuff[ 1 ], // format
    formatstuff[ 2 ], // type
    source, // pixels
  );
  gl.bindTexture( GL_TEXTURE_2D, null );

  return texture;
}
