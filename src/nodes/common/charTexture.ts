import { GL_NEAREST, GL_REPEAT, GL_RGBA, GL_RGBA8, GL_TEXTURE_2D, GL_UNSIGNED_BYTE } from '../../gl/constants';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { glTextureWrap } from '../../gl/glTextureWrap';
import { gl } from '../../globals/canvas';
import char5x5Png from './char5x5.png';

export const charTexture = gl.createTexture()!;
glTextureFilter( charTexture, GL_NEAREST );
glTextureWrap( charTexture, GL_REPEAT );

const image = new Image();
image.onload = () => {
  gl.bindTexture( GL_TEXTURE_2D, charTexture );
  gl.texImage2D( GL_TEXTURE_2D, 0, GL_RGBA8, GL_RGBA, GL_UNSIGNED_BYTE, image );
  gl.bindTexture( GL_TEXTURE_2D, null );
};
image.src = char5x5Png;
