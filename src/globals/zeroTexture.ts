import { glCreateTexture } from '../gl/glCreateTexture';

export const zeroTexture = glCreateTexture(
  1,
  1,
  new Uint8Array( [ 0, 0, 0, 0 ] ),
);
