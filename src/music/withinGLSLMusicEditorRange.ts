import { GLSLMusicEditorRange } from './GLSLMusicEditorRange';

export function withinGLSLMusicEditorRange(
  [ startLine, startCol, endLine, endCol ]: GLSLMusicEditorRange,
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
