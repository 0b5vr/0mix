import { GLTextureFormatStuff, glSetTexture } from './glSetTexture';
import { gl } from '../globals/canvas';

export function glCreateTexture(
  width: number,
  height: number,
  source: ArrayBufferView | null,
  formatstuff?: GLTextureFormatStuff,
): WebGLTexture {
  const texture = gl.createTexture()!;
  glSetTexture( texture, width, height, source, formatstuff );

  return texture;
}
