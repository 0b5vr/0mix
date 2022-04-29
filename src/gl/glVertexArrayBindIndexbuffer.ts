import { gl } from '../globals/canvas';
import { GL_ELEMENT_ARRAY_BUFFER } from './constants';

export function glVertexArrayBindIndexbuffer(
  vertexArray: WebGLVertexArrayObject,
  buffer: WebGLBuffer,
): void {
  gl.bindVertexArray( vertexArray );

  gl.bindBuffer( GL_ELEMENT_ARRAY_BUFFER, buffer );

  gl.bindVertexArray( null );
}
