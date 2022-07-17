import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { DEV_CANVAS_RESOLUTION } from './config';
import { Material } from './heck/Material';
import { audio } from './globals/audio';
import { automaton } from './globals/automaton';
import { canvas } from './globals/canvas';
import { dog, initDesktop } from './scene';
import { getDivCanvasContainer } from './globals/dom';
import { gui } from './globals/gui';
import { music } from './globals/music';

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( import.meta.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  const divCanvasContainer = getDivCanvasContainer();

  divCanvasContainer.appendChild( canvas );
  ( canvas.style as any ).aspectRatio = 'auto 16 / 9';
  canvas.style.margin = 'auto';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
}

// == dev kickstarter ==============================================================================
if ( import.meta.env.DEV ) {
  const kickstartDev = async (): Promise<void> => {
    console.info( dog );

    [
      Material.d3dSucks(),
    ].map( ( task, i ) => {
      const taskname = [ 'shaders', 'music' ][ i ];
      task.onProgress = ( progress ) => {
        const gui_ = gui;
        gui_?.monitor( `tasks/${ taskname }`, `${ Math.floor( progress * 100.0 ) }%` );
      };
      return task.promise;
    } );

    initDesktop( DEV_CANVAS_RESOLUTION[ 0 ], DEV_CANVAS_RESOLUTION[ 1 ] );
    dog.active = true;
    ( automaton as AutomatonWithGUI ).play();
  };

  kickstartDev();
}

// == prod kickstarter =============================================================================
if ( !import.meta.env.DEV ) {
  document.body.innerHTML = '<select><option>640x360</option><option>1280x720</option><option selected>1920x1080</option><option>2560x1440</option><option>3840x2160</option></select><button>fullscreen (click this first)</button><button>start</button><a></a>1920x1080 is intended<style>a,button{display:block}canvas{position:fixed;left:0;top:0;width:100%;height:100%;cursor:none}</style>';

  const selects = document.querySelectorAll( 'select' );
  const anchors = document.querySelectorAll( 'a' );
  const buttons = document.querySelectorAll( 'button' );

  buttons[ 0 ].addEventListener( 'click', () => {
    document.documentElement.requestFullscreen();
  } );

  buttons[ 1 ].addEventListener( 'click', async () => {
    // -- set resolution ---------------------------------------------------------------------------
    const resostr = selects[ 0 ].value.split( 'x' );

    document.body.appendChild( canvas );
    await initDesktop( parseInt( resostr[ 0 ] ), parseInt( resostr[ 1 ] ) );

    // -- prepare stuff ----------------------------------------------------------------------------
    await Promise.all( [
      Material.d3dSucks(),
    ].map( ( task, i ) => {
      const a = anchors[ i ];
      const taskname = [ 'shaders' ][ i ];
      a.textContent = `${ taskname }: 0%`;
      task.onProgress = ( progress ) => (
        a.textContent = `${ taskname }: ${ Math.floor( progress * 100.0 ) }%`
      );
      return task.promise;
    } ) );

    // -- esc handler ------------------------------------------------------------------------------
    window.addEventListener( 'keydown', ( event ) => {
      if ( event.code === 'Escape' ) {
        music.isPlaying = false;
        music.update();
        dog.active = false;
      }
    } );

    // -- let's go ---------------------------------------------------------------------------------
    dog.active = true;

    audio.resume();
    music.time = 0.0;
    music.isPlaying = true;
  } );
}
