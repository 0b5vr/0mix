import { GL_POINTS, GL_LINES, GL_LINE_LOOP, GL_LINE_STRIP, GL_TRIANGLES, GL_TRIANGLE_FAN, GL_TRIANGLE_STRIP } from './constants';

export type GLDrawMode =
  | typeof GL_POINTS
  | typeof GL_LINES
  | typeof GL_LINE_LOOP
  | typeof GL_LINE_STRIP
  | typeof GL_TRIANGLES
  | typeof GL_TRIANGLE_FAN
  | typeof GL_TRIANGLE_STRIP;
