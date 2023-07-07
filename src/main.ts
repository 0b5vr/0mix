import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { MusicEngineOffline } from './music/MusicEngineOffline';
import { MusicEngineRealtime } from './music/MusicEngineRealtime';
import { audio } from './globals/audio';
import { automaton, automatonSetupMusic } from './globals/automaton';
import { canvas } from './globals/canvas';
import { dog } from './scene';
import { editorVisibleObservers, resizeObservers } from './globals/globalObservers';
import { getDivCanvasContainer } from './globals/dom';
import { music } from './globals/music';
import { notifyObservers } from '@0b5vr/experimental';
import { prepare } from './globals/preparationTasks';
import { promiseGui } from './globals/gui';

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
  music.setEngine( new MusicEngineRealtime() );
  automatonSetupMusic( music );

  const kickstartDev = async (): Promise<void> => {
    console.info( dog );

    notifyObservers( resizeObservers, [ 1920, 1080 ] );
    dog.active = true;

    if ( ( automaton as AutomatonWithGUI ).isPlaying ) {
      ( automaton as AutomatonWithGUI ).play();
    }
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
      notifyObservers( resizeObservers, [ value * 16 / 9, value ] );
    } );
  } );

  kickstartDev();
}

// == prod kickstarter =============================================================================
if ( !import.meta.env.DEV ) {
  document.body.innerHTML = 'resolution: <select><option>640x360</option><option>960x540</option><option>1280x720</option><option selected>1920x1080</option><option>2560x1440</option><option>3840x2160</option></select><br>music: <select><option>realtime</option><option>offline</option></select><br><input type="checkbox" checked /> Show Code<br><button>fullscreen (click this first)</button><br><button>start</button><br>1920x1080 is intended';

  const select = document.querySelectorAll( 'select' );
  const inputs = document.querySelectorAll( 'input' );
  const buttons = document.querySelectorAll( 'button' );

  buttons[ 0 ].addEventListener( 'click', () => {
    document.documentElement.requestFullscreen();
  } );

  buttons[ 1 ].addEventListener( 'click', async () => {
    audio.resume();

    // -- set resolution ---------------------------------------------------------------------------
    const reso = select[ 0 ].value.split( 'x' )
      .map( ( v ) => parseInt( v ) ) as [ number, number ];

    notifyObservers( resizeObservers, reso );

    // -- set music renderer -----------------------------------------------------------------------
    const engine = select[ 1 ].value === 'realtime'
      ? new MusicEngineRealtime()
      : new MusicEngineOffline();

    music.setEngine( engine );

    // -- should we show the code? -----------------------------------------------------------------
    notifyObservers( editorVisibleObservers, inputs[ 0 ].checked );

    // -- prepare canvas ---------------------------------------------------------------------------
    document.body.innerHTML = '<style>body{margin:0;background:#000}canvas{width:100%;height:100%;object-fit:contain;cursor:none}</style>';
    document.body.appendChild( canvas );

    // -- prepare stuff ----------------------------------------------------------------------------
    await prepare();

    // -- esc handler ------------------------------------------------------------------------------
    window.addEventListener( 'keydown', ( event ) => {
      if ( event.code === 'Escape' ) {
        music.pause();
        dog.active = false;
      }
    } );

    // -- let's go ---------------------------------------------------------------------------------
    music.play();
  } );
}
