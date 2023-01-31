import { CharRenderer } from './CharRenderer/CharRenderer';
import { GLSLMusicEditorRange } from '../../music/GLSLMusicEditorRange';
import { Lambda } from '../../heck/components/Lambda';
import { MUSIC_BPM } from '../../config';
import { RenderTarget } from '../../heck/RenderTarget';
import { arraySerial } from '@0b5vr/experimental';
import { music } from '../../globals/music';
import { vec2 } from '../../shaders/shaderBuilder';

export class StatsText extends CharRenderer {
  public constructor( target: RenderTarget ) {
    super( {
      target,
      chars: 256,
      anchor: vec2( 1.0, -1.0 ),
      offset: vec2( -4.0, -4.0 ),
      textAlign: 1.0,
      textBaseline: 1.0,
    } );

    // -- set stats --------------------------------------------------------------------------------
    this.children.unshift( new Lambda( {
      onUpdate: ( { time } ) => {
        const beat = time / 60.0 * MUSIC_BPM;
        const beatIndicator = arraySerial( 4 ).map( ( i ) => (
          Math.floor( beat % 4.0 ) === i ? '*' : '.'
        ) ).join( '' );

        const content = [
          'status: ' + music.cueStatus,
          'beat: ' + beatIndicator,
          'time: ' + time.toFixed( 3 ),
          '0b5vr glsl techno live set',
        ];
        const select: GLSLMusicEditorRange = [ 0, 0, music.cueStatus === 'none' ? 0 : 1, 0 ];

        this.setContent( content, select );
      }
    } ) );
  }
}
