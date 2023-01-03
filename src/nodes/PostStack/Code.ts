import { EventType, on } from '../../globals/globalEvent';
import { RenderTarget } from '../../heck/RenderTarget';
import { shaderEventManager } from '../../music/ShaderEventManager';
import { vec2 } from '../../shaders/shaderBuilder';
import { CharRenderer } from './CharRenderer/CharRenderer';

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
      this.setContent( shaderEventManager.lines, change, shaderEventManager.select );
      this.scrollTarget = shaderEventManager.select[ 2 ];
    } );
  }
}
