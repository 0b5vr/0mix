import { gl } from '../globals/canvas';
import { GL_TEXTURE_2D } from './constants';
import { GLTextureFormatStuff, GLTextureFormatStuffRGBA8 } from './glSetTexture';

export function glSetTextureFromBitmap(
  texture: WebGLTexture,
  bitmap: TexImageSource,
  formatstuff: GLTextureFormatStuff = GLTextureFormatStuffRGBA8,
): WebGLTexture {
  gl.bindTexture( GL_TEXTURE_2D, texture );
  gl.texImage2D(
    GL_TEXTURE_2D, // target
    0, // level
    formatstuff[ 0 ], // internalformat
    formatstuff[ 1 ], // format
    formatstuff[ 2 ], // type
    bitmap, // source
  );
  gl.bindTexture( GL_TEXTURE_2D, null );

  return texture;
}
