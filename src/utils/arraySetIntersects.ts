import { arraySetHas } from '@0b5vr/experimental';

export function arraySetIntersects<T>( a: Array<T>, b: Array<T> ): boolean {
  return a.some( ( v ) => arraySetHas( b, v ) );
}
