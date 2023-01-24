import { EventType, emit } from '../globals/globalEvent';
import { MUSIC_BPM } from '../config';
import { ShaderEventRange } from './ShaderEventRange';
import { ShaderEventType, shaderEvents } from './shaderEvents';
import { clamp } from '@0b5vr/experimental';
import { findMatchingCloseBracket } from './utils/findMatchingCloseBracket';
import { findNearestChar } from './utils/findNearestChar';

let shaderEventsProxy = shaderEvents;

export class ShaderEventManager {
  public lines: string[];

  public select: ShaderEventRange;
  public focusRow: number;

  public eventBeatAccum: number;
  public eventIndexHead: number;

  public get code(): string {
    return this.lines.join( '\n' );
  }

  public constructor() {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.focusRow = 0;
    this.eventBeatAccum = 0.0;
    this.eventIndexHead = 0;
  }

  public reset(): void {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.eventBeatAccum = 0.0;
    this.eventIndexHead = 0;
  }

  public update( time: number ): void {
    for ( ;; ) {
      const event = shaderEventsProxy[ this.eventIndexHead ];
      if ( !event ) { break; }

      const eventBeat = this.eventBeatAccum + event[ 0 ];
      const beat = time * MUSIC_BPM / 60.0;
      if ( beat < eventBeat ) { break; }

      if ( event[ 1 ] === ShaderEventType.Insert ) {
        const a = this.lines[ this.select[ 0 ] ].substring( 0, this.select[ 1 ] );
        const b = this.lines[ this.select[ 2 ] ].substring( this.select[ 3 ] );
        const insert = ( a + event[ 2 ] + b ).split( '\n' );

        this.lines.splice(
          this.select[ 0 ],
          this.select[ 2 ] - this.select[ 0 ] + 1,
          ...insert,
        );

        const selectRow = this.select[ 0 ] + insert.length - 1;
        const selectCol = insert[ insert.length - 1 ].length - b.length;
        this.select = [ selectRow, selectCol, selectRow, selectCol ];
        this.focusRow = selectRow;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Delete ) {
        this.lines[ this.select[ 0 ] ] = (
          this.lines[ this.select[ 0 ] ].substring( 0, this.select[ 1 ] - 1 )
          + this.lines[ this.select[ 0 ] ].substring( this.select[ 1 ] )
        );

        this.select[ 1 ] --;
        this.select[ 3 ] --;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Comment ) {
        const lines = this.lines.splice(
          this.select[ 0 ],
          this.select[ 2 ] - this.select[ 0 ] + 1,
        );

        let indentSize = 100;
        lines.map( ( line ) => {
          const trimmedLength = line.trimStart().length;
          if ( trimmedLength /* !== 0 */ ) {
            indentSize = Math.min( indentSize, line.length - trimmedLength );
          }
        } );

        const indentSpaces = ' '.repeat( indentSize );

        this.lines.splice(
          this.select[ 0 ],
          0,
          ...lines.map( ( line ) => line.replace( indentSpaces, indentSpaces + '// ' ) ),
        );

        this.select[ 1 ] += 3;
        this.select[ 3 ] += 3;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Uncomment ) {
        const lines = this.lines.splice(
          this.select[ 0 ],
          this.select[ 2 ] - this.select[ 0 ] + 1,
        );

        this.lines.splice(
          this.select[ 0 ],
          0,
          ...lines.map( ( line ) => line.replace( '// ', '' ) ),
        );

        this.select[ 1 ] = Math.max( this.select[ 1 ] - 3, 0 );
        this.select[ 3 ] = Math.max( this.select[ 3 ] - 3, 0 );

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Apply ) {
        emit( EventType.ShaderEventApply, this.code );
      } else if ( event[ 1 ] === ShaderEventType.Move ) {
        const [ deltaRow, deltaCol ] = event[ 2 ];
        const isForward = 0 < deltaRow || 0 < deltaCol;

        let row = isForward ? this.select[ 2 ] : this.select[ 0 ];
        let col = isForward ? this.select[ 3 ] : this.select[ 1 ];

        if ( deltaRow ) {
          row = clamp( row + deltaRow, 0, this.lines.length - 1 );
          col = Math.min( this.lines[ row ].length, col );
        } else {
          col = clamp( col + deltaCol, 0, this.lines[ row ].length );
        }

        this.select = [ row, col, row, col ];
        this.focusRow = row;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.MoveStart ) {
        const [ deltaRow, deltaCol ] = event[ 2 ];

        let row = this.select[ 0 ];
        let col = this.select[ 1 ];

        if ( deltaRow ) {
          row = clamp( row + deltaRow, 0, this.lines.length - 1 );
          col = Math.min( this.lines[ row ].length, col );
        } else {
          col = clamp( col + deltaCol, 0, this.lines[ row ].length );
        }

        this.select = [
          row,
          col,
          this.select[ 2 ],
          this.select[ 3 ],
        ];
        this.focusRow = row;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.MoveEnd ) {
        const [ deltaRow, deltaCol ] = event[ 2 ];

        let row = this.select[ 2 ];
        let col = this.select[ 3 ];

        if ( deltaRow ) {
          row = clamp( row + deltaRow, 0, this.lines.length - 1 );
          col = Math.min( this.lines[ row ].length, col );
        } else {
          col = clamp( col + deltaCol, 0, this.lines[ row ].length );
        }

        this.select = [
          this.select[ 0 ],
          this.select[ 1 ],
          row,
          col,
        ];
        this.focusRow = row;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.JumpPart ) {
        const dir = event[ 2 ];

        const bracketOpen = findNearestChar(
          this.lines,
          [ this.select[ 0 ], this.select[ 1 ] ],
          dir,
          '{',
        );

        if ( !bracketOpen ) {
          return;
        }

        const bracketClose = findMatchingCloseBracket(
          this.lines,
          bracketOpen,
        );

        if ( !bracketClose ) {
          return;
        }

        this.select = [
          bracketOpen[ 0 ],
          bracketOpen[ 1 ],
          bracketClose[ 0 ],
          bracketClose[ 1 ] + 1,
        ];
        this.focusRow = ( bracketOpen[ 0 ] + bracketClose[ 0 ] ) / 2;

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.ExpandSelectBack ) {
        const bracket = findNearestChar(
          this.lines,
          [ this.select[ 0 ], this.select[ 1 ] ],
          -1,
          '{',
        );

        if ( !bracket ) {
          return;
        }

        this.select = [
          bracket[ 0 ],
          bracket[ 1 ],
          this.select[ 2 ],
          this.select[ 3 ],
        ];
        this.focusRow = bracket[ 0 ];

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.ExpandSelectForward ) {
        const bracket = findNearestChar(
          this.lines,
          [ this.select[ 2 ], this.select[ 3 ] ],
          1,
          '}',
        );

        if ( !bracket ) {
          return;
        }

        this.select = [
          this.select[ 0 ],
          this.select[ 1 ],
          bracket[ 0 ],
          bracket[ 1 ] + 1,
        ];
        this.focusRow = bracket[ 0 ];

        emit( EventType.ShaderEventAlter );
      }

      this.eventBeatAccum += event[ 0 ];
      this.eventIndexHead ++;
    }
  }
}

export const shaderEventManager = new ShaderEventManager();

if ( import.meta.hot ) {
  import.meta.hot.accept( './shaderEvents', ( { shaderEvents } ) => {
    shaderEventsProxy = shaderEvents;
    shaderEventManager.reset();
  } );
}
