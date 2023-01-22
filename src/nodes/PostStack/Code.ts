import { CharRenderer } from './CharRenderer/CharRenderer';
import { EventType, on } from '../../globals/globalEvent';
import { RenderTarget } from '../../heck/RenderTarget';
import { gui } from '../../globals/gui';
import { shaderEventManager } from '../../music/ShaderEventManager';
import { vec2 } from '../../shaders/shaderBuilder';

export class Code extends CharRenderer {
  public constructor( target: RenderTarget ) {
    super( {
      target,
      chars: 65536,
      anchor: vec2( -1.0, 0.0 ),
      offset: vec2( 60.0, 0.0 ),
    } );

    // -- set code ---------------------------------------------------------------------------------
    on( EventType.ShaderEventAlter, ( change ) => {
      let { lines, select } = shaderEventManager;

      if ( import.meta.env.DEV ) {
        if ( gui?.value( 'Code/line', false ) ) {
          lines = shaderEventManager.lines.map(
            ( line, iLine ) => `${ iLine }`.padStart( 3, '0' ) + ' ' + line
          );

          select = [
            select[ 0 ],
            select[ 1 ] + 4,
            select[ 2 ],
            select[ 3 ] + 4,
          ];
        }
      }

      this.setContent( lines, change, select );
      this.scrollTarget = shaderEventManager.select[ 2 ];
    } );
  }
}
