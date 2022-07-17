import { GL_NEAREST, GL_LINEAR } from './constants';

export type GLBlitFilter =
  | typeof GL_NEAREST
  | typeof GL_LINEAR;
