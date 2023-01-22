import { ShaderEventRange } from './ShaderEventRange';
import initGlsl from './shaders/init.glsl?raw';

export enum ShaderEventType {
  Insert,
  Select,
  Comment,
  Uncomment,
  Apply,
}

export type ShaderEvent = [
  beatOffset: number,
  type: ShaderEventType.Insert,
  code: string,
] | [
  beatOffset: number,
  type: ShaderEventType.Select,
  params: ShaderEventRange,
] | [
  beatOffset: number,
  type: ShaderEventType.Comment,
] | [
  beatOffset: number,
  type: ShaderEventType.Uncomment,
] | [
  beatOffset: number,
  type: ShaderEventType.Apply,
];

export const shaderEvents: ShaderEvent[] = [
  [ 8.0, ShaderEventType.Insert, initGlsl ],
  [ 1.0, ShaderEventType.Apply ],
  [ 1000.0, ShaderEventType.Select, [ 120, 0, 120, 1 ] ],
  [ 2.0, ShaderEventType.Select, [ 126, 5, 126, 6 ] ],
  [ 2.0, ShaderEventType.Select, [ 126, 5, 135, 6 ] ],
  [ 0.5, ShaderEventType.Uncomment ],
  [ 0.5, ShaderEventType.Apply ],
  [ 14.0, ShaderEventType.Select, [ 145, 2, 145, 3 ] ],
  [ 2.0, ShaderEventType.Select, [ 145, 2, 149, 3 ] ],
  [ 2.0, ShaderEventType.Comment ],
  [ 0.5, ShaderEventType.Apply ],
];
