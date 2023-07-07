import { Music } from '../music/Music';
import { MusicOffline } from '../music/MusicOffline';
import { audio } from './audio';
import { audioReverb } from './audioReverb';
import { automatonSetupMusic } from './automaton';
import { promiseGui } from './gui';

const music: Music = new MusicOffline();

music.gainNode.connect( audioReverb );
music.gainNode.connect( audio.destination );

if ( import.meta.env.DEV ) {
  music.gainNode.gain.value = 0.0;
  promiseGui.then( ( gui ) => {
    gui.button( 'audio/resume', { title: 'audio.resume();' } ).on( 'click', () => {
      audio.resume();
    } );

    gui.input( 'audio/volume', 0.0, { min: 0.0, max: 1.0 } )?.on( 'change', ( { value } ) => {
      music.gainNode.gain.value = value;
    } );
  } );
}

automatonSetupMusic( music );

export { music };
