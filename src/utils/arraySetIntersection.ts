import { arraySetHas } from '@0b5vr/experimental';

export function arraySetIntersection<T>( a: Array<T>, b: Array<T> ): Array<T> {
  const out: Array<T> = [];
  a.map( ( v ) => {
    if ( arraySetHas( b, v ) ) {
      out.push( v );
    }
  } );
  return out;
}
