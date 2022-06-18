import { MUSIC_BPM } from '../config';
import { ShaderEventRange } from './ShaderEventRange';
import { shaderEvents, ShaderEventType } from './shaderEvents';

export class ShaderEventManager {
  public lines: string[];

  public select: ShaderEventRange;

  public eventBeatAccum: number;
  public eventIndexHead: number;

  public onApply: ( code: string ) => void;
  public onAlter?: ( change: ShaderEventRange ) => void;

  public get code() {
    return this.lines.join( '\n' );
  }

  public constructor( onApply: ( code: string ) => void ) {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.eventBeatAccum = 0.0;
    this.eventIndexHead = 0;
    this.onApply = onApply;
  }

  public reset(): void {
    this.lines = [ '' ];
    this.select = [ 0, 0, 0, 0 ];
    this.eventBeatAccum = 0.0;
    this.eventIndexHead = 0;
  }

  public update( time: number ): void {
    for ( ;; ) {
      const event = shaderEvents[ this.eventIndexHead ];
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

        const selectLine = this.select[ 0 ] + insert.length;
        const selectCol = insert[ insert.length - 1 ].length - b.length;
        const alterRange: ShaderEventRange = [ this.select[ 0 ], a.length, selectLine, selectCol ];
        this.select = [ selectLine, selectCol, selectLine, selectCol ];

        this.onAlter?.( alterRange );
      } else if ( event[ 1 ] === ShaderEventType.Select ) {
        this.select = event[ 2 ];

        this.onAlter?.( [ 0, 0, 0, 0 ] );
      } else if ( event[ 1 ] === ShaderEventType.Comment ) {
        const lines = this.lines.splice(
          this.select[ 0 ],
          this.select[ 2 ] - this.select[ 0 ] + 1,
        );

        this.lines.splice(
          this.select[ 0 ],
          0,
          ...lines.map( ( line ) => ' '.repeat( event[ 2 ] ) + '// ' + line.substring( event[ 2 ] ) ),
        );

        const selectLine = this.select[ 2 ];
        const selectCol = this.lines[ this.select[ 2 ] ].length;
        const alterRange: ShaderEventRange = [ this.select[ 0 ], 0, selectLine, selectCol ];
        this.select = [ selectLine, selectCol, selectLine, selectCol ];

        this.onAlter?.( alterRange );
      } else if ( event[ 1 ] === ShaderEventType.Apply ) {
        this.onApply( this.code );
      }

      this.eventBeatAccum += event[ 0 ];
      this.eventIndexHead ++;
    }
  }
}