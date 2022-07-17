import { ShaderEventRange } from './ShaderEventRange';

export function withinShaderEventRange(
  range: ShaderEventRange,
  line: number,
  col: number,
): boolean {
  if ( range[ 0 ] === range[ 2 ] ) {
    return ( range[ 1 ] <= col && col < range[ 3 ] );
  }

  return (
    ( range[ 0 ] === line && range[ 1 ] <= col ) ||
    ( range[ 0 ] < line && line < range[ 2 ] ) ||
    ( range[ 2 ] === line && col < range[ 3 ] )
  );
}
