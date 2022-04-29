import { gl } from '../globals/canvas';
import { GL_COLOR_ATTACHMENT0 } from './constants';

export function glDrawBuffersByNumber( numBuffers: number ) {
  gl.drawBuffers( [ ...Array( numBuffers ) ].map( ( _, i ) => (
    GL_COLOR_ATTACHMENT0 + i
  ) ) );
}
