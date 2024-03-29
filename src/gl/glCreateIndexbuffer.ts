import { GLBufferUsage } from './GLBufferUsage';
import { GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW } from './constants';
import { gl } from '../globals/canvas';

export function glCreateIndexbuffer(
  source: BufferSource | null,
  usage: GLBufferUsage = GL_STATIC_DRAW,
): WebGLBuffer {
  const buffer = gl.createBuffer()!;

  gl.bindBuffer( GL_ELEMENT_ARRAY_BUFFER, buffer );
  gl.bufferData( GL_ELEMENT_ARRAY_BUFFER, source, usage );
  gl.bindBuffer( GL_ELEMENT_ARRAY_BUFFER, null );

  return buffer;
}
