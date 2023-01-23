import { EventType, emit } from '../globals/globalEvent';
import { MUSIC_BPM } from '../config';
import { ShaderEventRange } from './ShaderEventRange';
import { ShaderEventType, shaderEvents } from './shaderEvents';

let shaderEventsProxy = shaderEvents;

export class ShaderEventManager {
  public lines: string[];

  public select: ShaderEventRange;

  public eventBeatAccum: number;
  public eventIndexHead: number;

  public get code(): string {
    return this.lines.join( '\n' );
  }

  public constructor() {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
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

        const selectLine = this.select[ 0 ] + insert.length - 1;
        const selectCol = insert[ insert.length - 1 ].length - b.length;
        this.select = [ selectLine, selectCol, selectLine, selectCol ];

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Delete ) {
        this.lines[ this.select[ 0 ] ] = (
          this.lines[ this.select[ 0 ] ].substring( 0, this.select[ 1 ] - 1 )
          + this.lines[ this.select[ 0 ] ].substring( this.select[ 1 ] )
        );

        this.select[ 1 ] --;
        this.select[ 3 ] --;

        emit( EventType.ShaderEventAlter );

      } else if ( event[ 1 ] === ShaderEventType.Select ) {
        this.select = event[ 2 ].concat() as ShaderEventRange;

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

        const selectLine = this.select[ 2 ];
        const selectCol = this.lines[ this.select[ 2 ] ].length;
        this.select = [ selectLine, selectCol, selectLine, selectCol ];

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

        const selectLine = this.select[ 2 ];
        const selectCol = this.lines[ this.select[ 2 ] ].length;
        this.select = [ selectLine, selectCol, selectLine, selectCol ];

        emit( EventType.ShaderEventAlter );
      } else if ( event[ 1 ] === ShaderEventType.Apply ) {
        emit( EventType.ShaderEventApply, this.code );
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
