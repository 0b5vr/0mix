import { BufferTextureRenderTarget } from '../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffRGBA8 } from '../gl/glSetTexture';
import { GL_NEAREST } from '../gl/constants';
import { canvasRenderTarget } from './canvasRenderTarget';
import { glTextureFilter } from '../gl/glTextureFilter';

let postTarget = canvasRenderTarget;

if ( import.meta.env.DEV ) {
  const target = postTarget = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA8 );
  glTextureFilter( target.texture, GL_NEAREST );
}

export { postTarget };
