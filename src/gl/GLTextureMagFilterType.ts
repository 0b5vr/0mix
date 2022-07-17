import { GL_NEAREST, GL_LINEAR } from './constants';

export type GLTextureMagFilterType =
  | typeof GL_NEAREST
  | typeof GL_LINEAR;
