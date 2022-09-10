import { Automaton } from '@0b5vr/automaton';
import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { MUSIC_BPM } from '../config';
import { Music } from '../music/Music';
import { fxDefinitions } from './automaton-fxs/fxDefinitions';
import { getDivAutomaton } from './dom';
import { shaderEventManager } from '../music/ShaderEventManager';
import automatonData from '../automaton.json';

// it's pointless to live reload automatonData
if ( import.meta.hot ) {
  import.meta.hot.accept( '../automaton', () => {
    // do nothing
  } );
}

export const automaton = ( () => {
  if ( import.meta.env.DEV ) {
    const automatonWithGUI = new AutomatonWithGUI(
      automatonData,
      {
        gui: getDivAutomaton(),
        isPlaying: true,
        fxDefinitions,
      },
    );

    return automatonWithGUI;
  } else {
    return new Automaton(
      automatonData,
      {
        fxDefinitions,
      },
    );
  }
} )();

/**
 * Since automaton and music try to reference each other...
 */
export function automatonSetupMusic( music: Music ): void {
  if ( import.meta.env.DEV ) {
    const automatonWithGUI = automaton as AutomatonWithGUI;

    automatonWithGUI.on( 'play', () => { music.isPlaying = true; } );
    automatonWithGUI.on( 'pause', () => { music.isPlaying = false; } );
    automatonWithGUI.on( 'seek', ( { time } ) => {
      music.time = Math.max( 0.0, time );
      shaderEventManager.reset();
      automatonWithGUI.reset();
    } );

    automatonWithGUI.resume( 'glsl-techno-set-resume' );

    window.addEventListener( 'keydown', ( event ) => {
      if ( event.key === ' ' ) {
        automatonWithGUI.togglePlay();
      } else if ( event.key === 'ArrowLeft' ) {
        automatonWithGUI.seek( automaton.time - 240.0 / MUSIC_BPM );
      } else if ( event.key === 'ArrowRight' ) {
        automatonWithGUI.seek( automaton.time + 240.0 / MUSIC_BPM );
      }
    } );
  }
}

export const auto = automaton.auto;
