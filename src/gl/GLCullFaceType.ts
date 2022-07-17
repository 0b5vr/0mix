import { GL_BACK, GL_FRONT, GL_FRONT_AND_BACK } from './constants';

export type GLCullFaceType =
  | typeof GL_BACK
  | typeof GL_FRONT
  | typeof GL_FRONT_AND_BACK;
