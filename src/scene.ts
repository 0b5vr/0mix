import { CameraStack } from './nodes/CameraStack/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Dog } from './heck/Dog';
import { IBLLUTCalc } from './nodes/IBLLUTCalc/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { automaton } from './globals/automaton';
import { canvas, gl } from './globals/canvas';
import { music } from './globals/music';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';
import { SpongeScene } from './nodes/SpongeScene/SpongeScene';
import { LineWave } from './nodes/LineWave/LineWave';

// == dog ==========================================================================================
export const dog = new Dog();
dog.active = false;

// Mr. Update Everything
if ( import.meta.env.DEV ) {
  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      randomTexture.update();
    },
    name: 'randomTexture',
  } ) );

  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      music.update();
    },
    name: 'music',
  } ) );

  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      automaton.update( music.time );
    },
    name: 'automaton',
  } ) );

  promiseGui.then( ( gui ) => {
    gui.input( 'webgl-memory/active', false );

    const webglMemory = gl.getExtension( 'GMAN_webgl_memory' );

    dog.root.children.push( new Lambda( {
      onUpdate: () => {
        if ( gui.value( 'webgl-memory/active' ) ) {
          if ( webglMemory == null ) {
            gui.monitor(
              'webgl-memory/unavailable',
              'make sure you import webgl-memory',
            );
          } else {
            const info = webglMemory.getMemoryInfo();

            gui.monitor(
              'webgl-memory/buffer',
              `${ info.resources.buffer } - ${ ( info.memory.buffer * 1E-6 ).toFixed( 1 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/texture',
              `${ info.resources.texture } - ${ ( info.memory.texture * 1E-6 ).toFixed( 1 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/renderbuffer',
              `${ info.resources.renderbuffer } - ${ ( info.memory.renderbuffer * 1E-6 ).toFixed( 1 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/program',
              info.resources.program,
            );
            gui.monitor(
              'webgl-memory/shader',
              info.resources.shader,
            );
            gui.monitor(
              'webgl-memory/drawingbuffer',
              `${ ( info.memory.drawingbuffer * 1E-6 ).toFixed( 1 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/total',
              `${ ( info.memory.total * 1E-6 ).toFixed( 1 ) } MB`,
            );
          }
        }
      },
    } ) );
  } );
} else {
  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      randomTexture.update();
      music.update();
      automaton.update( music.time );
    },
  } ) );
}

if ( import.meta.env.DEV ) {
  promiseGui.then( ( gui ) => {
    gui.input( 'active', true )?.on( 'change', ( { value } ) => {
      dog.active = value;
    } );

    // Esc = panic button
    window.addEventListener( 'keydown', ( event ) => {
      if ( event.code === 'Escape' ) {
        const input = (
          gui.input( 'active', true )?.controller_.valueController.view as any
        ).inputElement;

        if ( input.checked ) {
          input.click();
        }
      }
    } );
  } );
}

// == nodes =====================================================================================
// const plane = new Plane();
// dog.root.children.push( plane );

const iblLutCalc = new IBLLUTCalc();

const spongeScene = new SpongeScene();
const lineWave = new LineWave();

const cameraStackOptions = {
  scene: dog.root,
  withAO: true,
  withPost: true,
};

// const plane = new Plane();
// plane.transform.position = [ 0.0, 3.0, 5.0 ];
// plane.transform.scale = [ 1.0, 1.0, 1.0 ];

dog.root.children.push(
  iblLutCalc,
  // spongeScene,
  lineWave,
  // plane,
);

// -- desktop --------------------------------------------------------------------------------------
export async function initDesktop( width: number, height: number ): Promise<void> {
  canvas.width = width;
  canvas.height = height;

  const canvasRenderTarget = new CanvasRenderTarget();

  const cameraStack = new CameraStack( {
    ...cameraStackOptions,
    target: canvasRenderTarget,
  } );

  if ( import.meta.env.DEV ) {
    cameraStack.name = 'cameraStack';
  }

  spongeScene.cameraProxy.children = [ cameraStack ];
  lineWave.cameraProxy.children = [ cameraStack ];

  if ( import.meta.env.DEV ) {
    const { RTInspector } = await import( './nodes/RTInspector/RTInspector' );
    const { ComponentLogger } = await import( './nodes/ComponentLogger/ComponentLogger' );

    const rtInspector = new RTInspector( {
      target: canvasRenderTarget,
    } );
    dog.root.children.push( rtInspector );

    const componentLogger = new ComponentLogger();
    dog.root.children.push( componentLogger );
  }

  const update = function(): void {
    dog.update();

    requestAnimationFrame( update );
  };

  update();
}
