export function findNearestChar(
  lines: string[],
  [ row, col ]: [ number, number ],
  dir: -1 | 1,
  char: string,
): [ number, number ] | null {
  let result: [ number, number ] | null = null;

  if ( dir < 0 ) {
    lines.slice( 0, row + 1 )
      .reverse()
      .find( ( line, deltaRow ): boolean | void => {
        line = ( deltaRow === 0 ? line.substring( 0, col ) : line );
        const iCol = line.lastIndexOf( char );

        if ( iCol !== -1 ) {
          result = [ row - deltaRow, iCol ];
          return true;
        }
      } );

  } else {
    lines.slice( row )
      .find( ( line, deltaRow ): boolean | void => {
        line = ( deltaRow === 0 ? line.substring( col + 1 ) : line );
        const colOffset = deltaRow === 0 ? col + 1 : 0;
        const deltaCol = line.indexOf( char );

        if ( deltaCol !== -1 ) {
          result = [ row + deltaRow, deltaCol + colOffset ];
          return true;
        }
      } );
  }

  return result;
}
