import { mat4 } from '../shaderBuilder';

export const bayerMatrix4 = mat4(
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
);
