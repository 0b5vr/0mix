import { CharRenderer } from './CharRenderer/CharRenderer';
import { GLSLMusicEditorRange } from '../../music/GLSLMusicEditorRange';
import { RenderTarget } from '../../heck/RenderTarget';
import { glslMusicEditor } from '../../globals/glslMusicEditor';
import { gui } from '../../globals/gui';
import { vec2 } from '../../shaders/shaderBuilder';

export class Code extends CharRenderer {
  public constructor( target: RenderTarget ) {
    super( {
      target,
      chars: 65536,
      anchor: vec2( -1.0, 0.0 ),
      offset: vec2( 4.0, 0.0 ),
      useSyntaxHighlight: true,
    } );

    // -- set code ---------------------------------------------------------------------------------
    glslMusicEditor.observersAlter.push( () => {
      let lines = glslMusicEditor.lines.concat();
      const select = glslMusicEditor.select.concat() as GLSLMusicEditorRange;

      if ( select[ 0 ] === select[ 2 ] && select[ 1 ] === select[ 3 ] ) {
        if ( lines[ select[ 0 ] ]?.length === select[ 1 ] ) {
          lines[ select[ 0 ] ] += ' ';
        }

        select[ 3 ] ++;
      }

      if ( import.meta.env.DEV ) {
        if ( gui?.value( 'Code/line', false ) ) {
          lines = lines.map(
            ( line, iLine ) => `${ iLine }`.padStart( 3, '0' ) + ' ' + line
          );

          select[ 1 ] += 4;
          select[ 3 ] += 4;
        }
      }

      this.setContent( lines, select );
      this.scrollTarget = glslMusicEditor.focusRow[ 0 ];
    } );
  }
}
