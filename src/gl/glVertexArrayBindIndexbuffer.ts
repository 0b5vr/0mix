import { GL_ELEMENT_ARRAY_BUFFER } from './constants';
import { gl } from '../globals/canvas';

export function glVertexArrayBindIndexbuffer(
  vertexArray: WebGLVertexArrayObject,
  buffer: WebGLBuffer,
): void {
  gl.bindVertexArray( vertexArray );

  gl.bindBuffer( GL_ELEMENT_ARRAY_BUFFER, buffer );

  gl.bindVertexArray( null );
}
