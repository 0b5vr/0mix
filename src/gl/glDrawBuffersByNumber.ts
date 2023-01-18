import { GL_COLOR_ATTACHMENT0 } from './constants';
import { arraySerial } from '@0b5vr/experimental';
import { gl } from '../globals/canvas';

export function glDrawBuffersByNumber( numBuffers: number ): void {
  gl.drawBuffers(
    arraySerial( numBuffers ).map( ( i ) => GL_COLOR_ATTACHMENT0 + i )
  );
}
