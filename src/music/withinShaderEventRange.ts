import { ShaderEventRange } from './ShaderEventRange';

export function withinShaderEventRange(
  [ startLine, startCol, endLine, endCol ]: ShaderEventRange,
  line: number,
  col: number,
): boolean {
  if ( startLine === endLine ) {
    return startLine === line && ( startCol <= col && col < endCol );
  }

  return (
    ( startLine === line && startCol <= col ) ||
    ( startLine < line && line < endLine ) ||
    ( endLine === line && col < endCol )
  );
}
