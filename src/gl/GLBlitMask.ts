import { GL_COLOR_BUFFER_BIT, GL_DEPTH_BUFFER_BIT, GL_STENCIL_BUFFER_BIT } from './constants';

export type GLBlitMask =
  | typeof GL_COLOR_BUFFER_BIT
  | typeof GL_DEPTH_BUFFER_BIT
  | typeof GL_STENCIL_BUFFER_BIT;
