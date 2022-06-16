import { Automaton } from '@0b5vr/automaton';
import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { Music } from '../music/Music';
import { fxDefinitions } from './automaton-fxs/fxDefinitions';
import { getDivAutomaton } from './dom';
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
      music.shaderEventManager.reset();

      automatonWithGUI.reset();
    } );
  }
}

export const auto = automaton.auto;
