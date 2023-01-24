export function findMatchingCloseBracket(
  lines: string[],
  [ row, col ]: [ number, number ],
): [ number, number ] | null {
  let result: [ number, number ] | null = null;
  let nest = 1;

  lines.slice( row )
    .find( ( line, deltaRow ) => {
      let colOffset = 0;

      if ( deltaRow === 0 ) {
        line = line.substring( col + 1 );
        colOffset += col + 1;
      }

      for ( ;; ) {
        const match = line.match( /[{}]/ );

        if ( !match ) {
          break;
        }

        const deltaCol = match.index!;

        nest += match[ 0 ] === '{' ? 1 : -1;

        if ( nest === 0 ) {
          result = [ row + deltaRow, deltaCol + colOffset ];
          return true;
        } else {
          line = line.substring( deltaCol + 1 );
          colOffset += deltaCol + 1;
        }
      }
    } );

  return result;
}
