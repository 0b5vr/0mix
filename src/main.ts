import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { EventType, emit } from './globals/globalEvent';
import { Material } from './heck/Material';
import { audio } from './globals/audio';
import { automaton } from './globals/automaton';
import { canvas } from './globals/canvas';
import { dog } from './scene';
import { getDivCanvasContainer } from './globals/dom';
import { gui, promiseGui } from './globals/gui';
import { music } from './globals/music';

// == dom ==========================================================================================
if ( import.meta.env.DEV ) {
  document.body.style.margin = '0';
  document.body.style.padding = '0';
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

    emit( EventType.Resize, [ 1920, 1080 ] );
    dog.active = true;
    ( automaton as AutomatonWithGUI ).play();
  };

  promiseGui.then( ( gui ) => {
    gui.input( 'resolution', 1080, {
      options: {
        '640x360': 360,
        '960x540': 540,
        '1280x720': 720,
        '1920x1080': 1080,
      },
    } )?.on( 'change', ( { value } ) => {
      emit( EventType.Resize, [ value * 16 / 9, value ] );
    } );
  } );

  kickstartDev();
}

// == prod kickstarter =============================================================================
if ( !import.meta.env.DEV ) {
  document.body.innerHTML = '<select><option>640x360</option><option>960x540</option><option>1280x720</option><option selected>1920x1080</option><option>2560x1440</option><option>3840x2160</option></select><br><button>fullscreen (click this first)</button><br><button>start</button><br><a>1920x1080 is intended';

  const selects = document.querySelectorAll( 'select' );
  const anchors = document.querySelectorAll( 'a' );
  const buttons = document.querySelectorAll( 'button' );

  buttons[ 0 ].addEventListener( 'click', () => {
    document.documentElement.requestFullscreen();
  } );

  buttons[ 1 ].addEventListener( 'click', async () => {
    audio.resume();

    // -- prepare stuff ----------------------------------------------------------------------------
    await Promise.all( [
      Material.d3dSucks(),
    ].map( ( task, i ) => {
      const a = anchors[ i ];
      const taskname = [ 'shaders' ][ i ];
      a.textContent = `${ taskname }: 0%`;
      task.onProgress = ( progress ) => (
        a.textContent = `${ taskname }: ${ ~~( progress * 100.0 ) }%`
      );
      return task.promise;
    } ) );

    // -- set resolution ---------------------------------------------------------------------------
    const reso = selects[ 0 ].value.split( 'x' )
      .map( ( v ) => parseInt( v ) ) as [ number, number ];

    emit( EventType.Resize, reso );

    // -- prepare canvas ---------------------------------------------------------------------------
    document.body.innerHTML = '<style>body{margin:0;display:flex;background:#000}canvas{max-width:100%;max-height:100%;margin:auto;cursor:none}</style>';
    document.body.appendChild( canvas );

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

    music.time = 0.0;
    music.isPlaying = true;
  } );
}
