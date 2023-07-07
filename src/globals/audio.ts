import { promiseGui } from './gui';

export const audio = new AudioContext();
export const sampleRate = audio.sampleRate;

promiseGui.then( ( gui ) => {
  gui.button( 'audio/resume', { title: 'audio.resume();' } ).on( 'click', () => {
    audio.resume();
  } );
} );
