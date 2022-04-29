import { gl } from '../globals/canvas';
import { glSetTexture, GLTextureFormatStuff } from './glSetTexture';

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
