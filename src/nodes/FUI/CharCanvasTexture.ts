import { CanvasTexture } from '../utils/CanvasTexture';

/**
 * 6 xx xxx xx
 * 5 xx xxx xx
 *
 *
 * 4 xx xxx xx
 * 3 xx xxx xx
 * 2 xx xxx xx
 *
 *
 * 1 xx xxx xx
 * 0 xx xxx xx
 *   01 234 56
 */

const defaultCharArray: ( string | undefined )[] = [];
const defaultWidthArray: ( number | undefined )[] = [];

[
  '16 12,11 10', // !
  '16 15,36 35', // "
  '05 65,01 61,16 10,56 50', // #
  '65 56 16 05 04 13 53 62 61 50 10 01,36 30', // $
  '06 26 24 04 06,42 62 60 40 42,66 65 01 00', // %
  '63 53 42 41 30 10 01 02 13 33 44 45 36 16 05 04 13 33 42 41 50 60', // &
  '16 15', // '
  '36 25 21 30', // (
  '06 15 11 00', // )
  '36 32,65 03,05 63', // *
  '35 31,03 63', // +
  '11 00', // ,
  '03 43', // -
  '11 10', // .
  '66 65 01 00', // /
  '10 50 61 65 56 16 05 01 10,65 01', // 0
  '16 26 35 30,10 50', // 1
  '05 16 56 65 64 53 13 02 00 60', // 2
  '05 16 56 65 64 53 33,53 62 61 50 10 01', // 3
  '06 04 13 63,66 60', // 4
  '06 66,06 04 54 63 61 50 10 01', // 5
  '56 16 05 01 10 50 61 62 53 03', // 6
  '06 66 65 11 10', // 7
  '56 16 05 04 13 53 62 61 50 10 01 02 13 53 64 65 56', // 8
  '63 13 04 05 16 56 65 61 50 10 01', // 9
  '14 13,11 10', // :
  '14 13,11 00', // ;
  '65 03 61', // <
  '04 64,01 61', // =
  '05 63 01', // >
  '05 16 56 65 64 53 33 32,31 30', // ?
  '36 33 42 52 63 65 56 16 05 01 10 50', // @
  '00 03 26 46 63 60,02 62', // A
  '00 06 56 65 64 53 03,53 62 61 50 00', // B
  '65 56 16 05 01 10 50 61', // C
  '06 00,06 56 65 61 50 00', // D
  '06 66,03 63,06 00 60', // E
  '06 66,03 53,06 00', // F
  '65 56 16 05 01 10 50 61 63 43', // G
  '06 00,03 63,66 60', // H
  '16 10', // I
  '66 61 50 10 01 02', // J
  '06 00,66 65 43 03,43 61 60', // K
  '06 00 60', // L
  '00 06 33 32,33 66 60', // M
  '00 06 60 66', // N
  '10 50 61 65 56 16 05 01 10', // O
  '00 06 56 65 64 53 03', // P
  '10 50 61 65 56 16 05 01 10,42 61', // Q
  '00 06 56 65 64 53 03,53 62 60', // R
  '65 56 16 05 04 13 53 62 61 50 10 01', // S
  '06 66,36 30', // T
  '06 01 10 50 61 66', // U
  '06 03 20 40 63 66', // V
  '06 00 33 34,33 60 66', // W
  '06 05 61 60,66 65 01 00', // X
  '06 05 33,66 65 33 30', // Y
  '06 66 65 01 00 60', // Z
  '36 26 20 30', // [
  '06 05 61 60', // \
  '06 16 10 00', // ]
  '14 36 54', // ^
  '00 60', // _
  '06 15', // `
].map( ( str, i ) => {
  defaultCharArray[ 33 + i ] = str;
} );

[ ...Array( 26 ) ].map( ( _, i ) => {
  defaultCharArray[ 97 + i ] = defaultCharArray[ 65 + i ];
} );

[
  '36 25 21 30,13 23', // {
  '16 10', // |
  '06 15 11 00,13 23', // }
  '56 16 05 04 13 53 62 61 50 10 01 02 13 53 64 65 56,06 66 60 00 06,03 63,36 30', // ~ as a special
].map( ( str, i ) => {
  defaultCharArray[ 123 + i ] = str;
} );

defaultWidthArray[ 32 ] = 6; // space
[ ...'\'.,:;`|Ii' ].map( ( char ) => defaultWidthArray[ char.charCodeAt( 0 ) ] = 7 );
[ ...'()[]{}' ].map( ( char ) => defaultWidthArray[ char.charCodeAt( 0 ) ] = 8 );
[ ...'"-' ].map( ( char ) => defaultWidthArray[ char.charCodeAt( 0 ) ] = 9 );

export class CharCanvasTexture extends CanvasTexture {
  public charArray: ( string | undefined )[];
  public widthArray: ( number | undefined )[];
  public defaultWidth: number;
  public pointXMap: number[];
  public pointYMap: number[];

  public constructor( width: number, height: number ) {
    super( width, height );

    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.strokeStyle = '#fff';

    this.charArray = defaultCharArray.concat();
    this.widthArray = defaultWidthArray.concat();
    this.defaultWidth = 12;
    this.pointXMap = [ 0, 1.5, 2.5, 4, 5.5, 6.5, 8 ];
    this.pointYMap = [ 0, 1.5, 4.5, 6, 7.5, 10.5, 12 ];
  }

  public drawChars( x: number, y: number, scale: number, str: string, align?: number ): void {
    const { context, charArray, widthArray, defaultWidth, pointXMap, pointYMap } = this;

    context.lineWidth = 1.0;
    context.save();
    context.translate( x, y );
    context.scale( scale, scale );

    let totalWidth = 0;
    [ ...str ].map( ( char ) => {
      const charCode = char.charCodeAt( 0 );
      totalWidth += widthArray[ charCode ] ?? defaultWidth;
    } );

    if ( align != null ) {
      context.translate( -align * totalWidth, 0 );
    }

    [ ...str ].map( ( char ) => {
      const charCode = char.charCodeAt( 0 );
      const path = charArray[ charCode ];

      if ( path != null ) {
        const strokes = path.split( ',' );

        strokes.map( ( stroke ) => {
          const segments = stroke.split( ' ' );

          context.beginPath();

          segments.map( ( segment, i ) => {
            const point = [
              pointXMap[ parseInt( segment[ 0 ], 10 ) ],
              pointYMap[ parseInt( segment[ 1 ], 10 ) ],
            ] as [ number, number ];

            if ( i === 0 ) {
              context.moveTo( ...point );
            } else {
              context.lineTo( ...point );
            }
          } );

          context.stroke();
        } );
      }

      const width = widthArray[ charCode ] ?? defaultWidth;
      context.translate( width, 0 );
    } );

    context.restore();
  }
}
