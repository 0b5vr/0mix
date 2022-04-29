import { gl } from '../globals/canvas';
import { GL_COLOR_BUFFER_BIT, GL_DEPTH_BUFFER_BIT } from './constants';

export function glClear( red = 0.0, green = 0.0, blue = 0.0, alpha = 1.0, depth = 1.0 ): void {
  gl.clearColor( red, green, blue, alpha );
  gl.clearDepth( depth );
  gl.clear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
}
