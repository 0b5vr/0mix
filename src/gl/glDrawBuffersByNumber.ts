import { GL_COLOR_ATTACHMENT0 } from './constants';
import { gl } from '../globals/canvas';

export function glDrawBuffersByNumber( numBuffers: number ): void {
  gl.drawBuffers( [ ...Array( numBuffers ) ].map( ( _, i ) => (
    GL_COLOR_ATTACHMENT0 + i
  ) ) );
}
