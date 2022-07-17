import { GL_UNSIGNED_BYTE, GL_UNSIGNED_SHORT, GL_UNSIGNED_INT } from './constants';

export type GLIndexType =
  | typeof GL_UNSIGNED_BYTE
  | typeof GL_UNSIGNED_SHORT
  | typeof GL_UNSIGNED_INT;
