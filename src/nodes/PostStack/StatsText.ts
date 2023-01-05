import { MUSIC_BPM } from '../../config';
import { music } from '../../globals/music';
import { Lambda } from '../../heck/components/Lambda';
import { RenderTarget } from '../../heck/RenderTarget';
import { ShaderEventRange } from '../../music/ShaderEventRange';
import { vec2 } from '../../shaders/shaderBuilder';
import { CharRenderer } from './CharRenderer/CharRenderer';

export class StatsText extends CharRenderer {
  public constructor( target: RenderTarget ) {
    super( {
      target,
      chars: 256,
      anchor: vec2( 1.0, -1.0 ),
      offset: vec2( -60.0, 60.0 ),
      textAlign: 1.0,
      textBaseline: 1.0,
    } );

    // -- set stats --------------------------------------------------------------------------------
    this.children.unshift( new Lambda( {
      onUpdate: ( { time } ) => {
        const beat = time / 60.0 * MUSIC_BPM;
        const beatIndicator = [ ...Array( 4 ) ].map( ( _, i ) => (
          Math.floor( beat % 4.0 ) === i ? '*' : '.'
        ) ).join( '' );

        const content = [
          'status: ' + music.cueStatus,
          'beat: ' + beatIndicator,
          'time: ' + time.toFixed( 3 ),
        ];
        const changeRange: ShaderEventRange = [ 0, 0, music.cueStatus === 'none' ? 0 : 1, 0 ];

        this.setContent( content, changeRange );
      }
    } ) );
  }
}