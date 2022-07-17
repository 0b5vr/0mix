import { GL_UNSIGNED_BYTE, GL_UNSIGNED_INT, GL_UNSIGNED_SHORT } from './constants';

export type GLIndexType =
  | typeof GL_UNSIGNED_BYTE
  | typeof GL_UNSIGNED_SHORT
  | typeof GL_UNSIGNED_INT;
