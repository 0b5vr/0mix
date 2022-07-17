import { GL_ARRAY_BUFFER, GL_FLOAT } from './constants';
import { gl } from '../globals/canvas';

export function glVertexArrayBindVertexbuffer(
  vertexArray: WebGLVertexArrayObject,
  buffer: WebGLBuffer,
  location: number,
  size: number,
  divisor = 0,
): void {
  gl.bindVertexArray( vertexArray );

  gl.bindBuffer( GL_ARRAY_BUFFER, buffer );
  gl.enableVertexAttribArray( location );
  gl.vertexAttribPointer( location, size, GL_FLOAT, false, 0, 0 );
  gl.vertexAttribDivisor( location, divisor );

  gl.bindVertexArray( null );
}
