export function getYugoppText( text: string, phase: number ): string {
  if ( phase >= 1.5 ) { return text; }
  if ( phase < 0.0 ) { return ''; }

  const displayTween = Math.min( Math.max( phase, 0.0 ), 1.0 );
  const fixTween = Math.min( Math.max( phase - 0.5, 0.0 ), 1.0 );

  const fixLength = Math.floor( text.length * fixTween );
  const randomLength = Math.floor( text.length * ( displayTween - fixTween ) + 1.0 );
  const randomStr = [ ...new Array( randomLength ) ]
    .map( () => String.fromCharCode( 33 + Math.floor( 93 * Math.random() ) ) )
    .join( '' );

  return text.substring( 0, fixLength ) + randomStr;

}
