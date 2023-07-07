import { GLSLMusicEditorEventType, glslMusicEditorEvents } from './glslMusicEditorEvents';
import { GLSLMusicEditorRange } from './GLSLMusicEditorRange';
import { MUSIC_BPM } from './constants';
import { Observer } from '../utils/Observer';
import { clamp, notifyObservers } from '@0b5vr/experimental';
import { findMatchingCloseBracket } from './utils/findMatchingCloseBracket';
import { findNearestChar } from './utils/findNearestChar';

let glslMusicEditorEventsProxy = glslMusicEditorEvents;

export class GLSLMusicEditor {
  public lines: string[];
  public select: GLSLMusicEditorRange;
  public focusRow: [ number ];
  public observersAlter: Observer<void>[];
  public observersApply: Observer<void>[];

  private __eventBeatAccum: number;
  private __eventIndexHead: number;

  public constructor() {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.focusRow = [ 0 ];
    this.observersAlter = [];
    this.observersApply = [];

    this.__eventBeatAccum = 0.0;
    this.__eventIndexHead = 0;

    if ( import.meta.hot ) {
      import.meta.hot.accept( './glslMusicEditorEvents', ( { glslMusicEditorEvents } ) => {
        glslMusicEditorEventsProxy = glslMusicEditorEvents;
        this.reset();
      } );
    }
  }

  public reset(): void {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.focusRow = [ 0 ];

    this.__eventBeatAccum = 0.0;
    this.__eventIndexHead = 0;
  }

  public update( time: number ): void {
    const event = glslMusicEditorEventsProxy[ this.__eventIndexHead ];
    if ( !event ) { return; }

    const eventBeat = this.__eventBeatAccum + event[ 0 ];
    const beat = time * MUSIC_BPM / 60.0;
    if ( beat < eventBeat ) { return; }

    const { lines, select, focusRow } = this;

    if ( event[ 1 ] === GLSLMusicEditorEventType.Insert ) {
      const a = lines[ select[ 0 ] ].substring( 0, select[ 1 ] );
      const b = lines[ select[ 2 ] ].substring( select[ 3 ] );
      const insert = ( a + event[ 2 ] + b ).split( '\n' );

      lines.splice(
        select[ 0 ],
        select[ 2 ] - select[ 0 ] + 1,
        ...insert,
      );

      // move selection to the end of inserted contents
      select[ 0 ] = select[ 2 ] = focusRow[ 0 ] = select[ 0 ] + insert.length - 1;
      select[ 1 ] = select[ 3 ] = insert[ insert.length - 1 ].length - b.length;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.Delete ) {
      lines[ select[ 0 ] ] = (
        lines[ select[ 0 ] ].substring( 0, select[ 1 ] - 1 )
        + lines[ select[ 0 ] ].substring( select[ 1 ] )
      );

      select[ 1 ] --;
      select[ 3 ] --;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.Comment ) {
      const modifyingLines = lines.splice(
        select[ 0 ],
        select[ 2 ] - select[ 0 ] + 1,
      );

      let indentSize = 100;
      modifyingLines.map( ( line ) => {
        const trimmedLength = line.trimStart().length;
        if ( trimmedLength /* !== 0 */ ) {
          indentSize = Math.min( indentSize, line.length - trimmedLength );
        }
      } );

      const indentSpaces = ' '.repeat( indentSize );

      lines.splice(
        select[ 0 ],
        0,
        ...modifyingLines.map( ( line ) => line.replace( indentSpaces, indentSpaces + '// ' ) ),
      );

      select[ 1 ] += 3;
      select[ 3 ] += 3;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.Uncomment ) {
      const modifyingLines = lines.splice(
        select[ 0 ],
        select[ 2 ] - select[ 0 ] + 1,
      );

      lines.splice(
        select[ 0 ],
        0,
        ...modifyingLines.map( ( line ) => line.replace( '// ', '' ) ),
      );

      select[ 1 ] = Math.max( select[ 1 ] - 3, 0 );
      select[ 3 ] = Math.max( select[ 3 ] - 3, 0 );

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.Apply ) {
      if ( import.meta.env.DEV ) {
        if ( eventBeat % 4.0 > 2.4 ) {
          console.warn( `Scary shader application at ${ ( eventBeat - 4.0 ).toFixed( 3 ) } (${ ( eventBeat % 4.0 ).toFixed( 3 ) } within the beat)` );
        }
      }

      notifyObservers( this.observersApply );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.Move ) {
      const [ deltaRow, deltaCol ] = event[ 2 ];
      const isForward = 0 < deltaRow || 0 < deltaCol;

      let row = isForward ? select[ 2 ] : select[ 0 ];
      let col = isForward ? select[ 3 ] : select[ 1 ];

      if ( deltaRow ) {
        row = clamp( row + deltaRow, 0, lines.length - 1 );
        col = Math.min( lines[ row ].length, col );
      } else {
        col = clamp( col + deltaCol, 0, lines[ row ].length );
      }

      select[ 0 ] = select[ 2 ] = focusRow[ 0 ] = row;
      select[ 1 ] = select[ 3 ] = col;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.MoveStart ) {
      const [ deltaRow, deltaCol ] = event[ 2 ];

      let row = select[ 0 ];
      let col = select[ 1 ];

      if ( deltaRow ) {
        row = clamp( row + deltaRow, 0, lines.length - 1 );
        col = Math.min( lines[ row ].length, col );
      } else {
        col = clamp( col + deltaCol, 0, lines[ row ].length );
      }

      select[ 0 ] = focusRow[ 0 ] = row;
      select[ 1 ] = col;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.MoveEnd ) {
      const [ deltaRow, deltaCol ] = event[ 2 ];

      let row = select[ 2 ];
      let col = select[ 3 ];

      if ( deltaRow ) {
        row = clamp( row + deltaRow, 0, lines.length - 1 );
        col = Math.min( lines[ row ].length, col );
      } else {
        col = clamp( col + deltaCol, 0, lines[ row ].length );
      }

      select[ 2 ] = focusRow[ 0 ] = row;
      select[ 3 ] = col;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.JumpPart ) {
      const dir = event[ 2 ];

      const bracketOpen = findNearestChar(
        lines,
        [ select[ 0 ], select[ 1 ] ],
        dir,
        '{',
      );

      if ( !bracketOpen ) {
        return;
      }

      const bracketClose = findMatchingCloseBracket(
        lines,
        bracketOpen,
      );

      if ( !bracketClose ) {
        return;
      }

      select[ 0 ] = focusRow[ 0 ] = bracketOpen[ 0 ];
      select[ 1 ] = bracketOpen[ 1 ];
      select[ 2 ] = bracketClose[ 0 ];
      select[ 3 ] = bracketClose[ 1 ] + 1;

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.ExpandSelectBack ) {
      const bracket = findNearestChar(
        lines,
        [ select[ 0 ], select[ 1 ] ],
        -1,
        '{',
      );

      if ( !bracket ) {
        return;
      }

      select[ 0 ] = focusRow[ 0 ] = bracket[ 0 ];
      select[ 1 ] = bracket[ 1 ];

      notifyObservers( this.observersAlter );
    } else if ( event[ 1 ] === GLSLMusicEditorEventType.ExpandSelectForward ) {
      const bracket = findNearestChar(
        lines,
        [ select[ 2 ], select[ 3 ] ],
        1,
        '}',
      );

      if ( !bracket ) {
        return;
      }

      select[ 2 ] = focusRow[ 0 ] = bracket[ 0 ];
      select[ 3 ] = bracket[ 1 ] + 1;

      notifyObservers( this.observersAlter );
    }

    this.__eventBeatAccum += event[ 0 ];
    this.__eventIndexHead ++;
  }
}
