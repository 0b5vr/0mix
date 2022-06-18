import { gl } from '../globals/canvas';
import { GL_FLOAT, GL_HALF_FLOAT, GL_R11F_G11F_B10F, GL_R16F, GL_RED, GL_RG, GL_RG16F, GL_RGB, GL_RGBA, GL_RGBA16F, GL_RGBA32F, GL_RGBA8, GL_TEXTURE_2D, GL_UNSIGNED_BYTE, GL_UNSIGNED_INT_10F_11F_11F_REV } from './constants';

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

export const GLTextureFormatStuffR11G11B10F: GLTextureFormatStuff = [
  GL_R11F_G11F_B10F,
  GL_RGB,
  GL_UNSIGNED_INT_10F_11F_11F_REV,
];

export const GLTextureFormatStuffRGBA16F: GLTextureFormatStuff = [
  GL_RGBA16F,
  GL_RGBA,
  GL_HALF_FLOAT,
];

export const GLTextureFormatStuffR16F: GLTextureFormatStuff = [
  GL_R16F,
  GL_RED,
  GL_HALF_FLOAT,
];

export const GLTextureFormatStuffRG16F: GLTextureFormatStuff = [
  GL_RG16F,
  GL_RG,
  GL_HALF_FLOAT,
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
