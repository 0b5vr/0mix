export const genToken = ( tokenIndex: number ): string => (
  ( tokenIndex > 25 ? genToken( ~~( tokenIndex / 26 - 1 ) ) : '' ) + String.fromCharCode( ( tokenIndex % 26 ) + 97 )
);
