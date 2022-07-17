import { GL_LINEAR, GL_NEAREST } from './constants';

export type GLTextureMagFilterType =
  | typeof GL_NEAREST
  | typeof GL_LINEAR;
