function quantize( v ) {
  return parseFloat( v.toFixed( 6 ) );
}

/**
 * @type {import('@0b5vr/automaton-with-gui').SerializedAutomatonWithGUI}
 */
const data = require( '../src/automaton.json' );

/**
 * @type {import('@0b5vr/automaton-with-gui').SerializedAutomatonWithGUI}
 */
const newData = JSON.parse( JSON.stringify( data ) );

const bpm = 140.0;
const t2b = bpm / 60.0;

newData.curves.map( ( curve ) => {
  curve.nodes.map( ( node ) => {
    if ( node[ 0 ] != null ) { node[ 0 ] = quantize( node[ 0 ] * t2b ); }
    if ( node[ 1 ] != null ) { node[ 1 ] = quantize( node[ 1 ] ); }
    if ( node[ 2 ] != null ) { node[ 2 ] = quantize( node[ 2 ] * t2b ); }
    if ( node[ 3 ] != null ) { node[ 3 ] = quantize( node[ 3 ] ); }
    if ( node[ 4 ] != null ) { node[ 4 ] = quantize( node[ 4 ] * t2b ); }
    if ( node[ 5 ] != null ) { node[ 5 ] = quantize( node[ 5 ] ); }
  } );
} );

newData.channels.map( ( [ name, channel ] ) => {
  channel.items.map( ( item ) => {
    if ( item.time ) { item.time = quantize( item.time * t2b ); }
    if ( item.length ) { item.length = quantize( item.length * t2b ); }
    if ( item.repeat ) { item.repeat = quantize( item.repeat * t2b ); }
    if ( item.offset ) { item.offset = quantize( item.offset * t2b ); }

    if ( item.speed ) { item.speed = quantize( item.speed ); }
    if ( item.amp ) { item.amp = quantize( item.amp ); }
    if ( item.value ) { item.value = quantize( item.value ); }
  } );
} );

Object.entries( newData.labels ).map( ( [ name, time ] ) => {
  newData.labels[ name ] = quantize( time * t2b );
} );

console.log( JSON.stringify( newData ) );
