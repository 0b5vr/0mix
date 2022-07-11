import { CameraStack } from './nodes/CameraStack/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Dog } from './heck/Dog';
import { IBLLUTCalc } from './nodes/IBLLUTCalc/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { automaton } from './globals/automaton';
import { canvas } from './globals/canvas';
import { music } from './globals/music';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';
import { SpongeScene } from './nodes/SpongeScene/SpongeScene';
import { LineWave } from './nodes/LineWave/LineWave';
import { PostStack } from './nodes/PostStack/PostStack';
import { BufferTextureRenderTarget } from './heck/BufferTextureRenderTarget';
import { Mixer } from './nodes/Mixer/Mixer';
import { GLTextureFormatStuffRGBA8 } from './gl/glSetTexture';
import { Blit } from './heck/components/Blit';
import { glTextureFilter } from './gl/glTextureFilter';
import { GL_NEAREST } from './gl/constants';
import { WebGLMemory } from './nodes/WebGLMemory/WebGLMemory';

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

  dog.root.children.push( new WebGLMemory() );
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
  withDoF: true,
};

// const plane = new Plane();
// plane.transform.position = [ 0.0, 3.0, 5.0 ];
// plane.transform.scale = [ 1.0, 1.0, 1.0 ];

dog.root.children.push(
  iblLutCalc,

  // A
  spongeScene,

  // B
  lineWave,

  // plane,
);

// -- desktop --------------------------------------------------------------------------------------
export async function initDesktop( width: number, height: number ): Promise<void> {
  canvas.width = width;
  canvas.height = height;

  const cameraStackTargetA = new BufferTextureRenderTarget( width, height );
  const cameraStackTargetB = new BufferTextureRenderTarget( width, height );
  const mixerTarget = new BufferTextureRenderTarget( width, height );

  const canvasRenderTarget = new CanvasRenderTarget();

  const cameraStackA = new CameraStack( {
    ...cameraStackOptions,
    target: cameraStackTargetA,
  } );

  const cameraStackB = new CameraStack( {
    ...cameraStackOptions,
    target: cameraStackTargetB,
  } );

  if ( import.meta.env.DEV ) {
    cameraStackA.name = 'cameraStackA';
    cameraStackB.name = 'cameraStackB';
  }

  spongeScene.cameraProxy.children = [ cameraStackA ];

  lineWave.cameraProxy.children = [ cameraStackB ];

  const mixer = new Mixer( {
    inputA: cameraStackTargetA,
    inputB: cameraStackTargetB,
    target: mixerTarget,
  } );

  const postTarget = import.meta.env.DEV
    ? new BufferTextureRenderTarget( width, height, 1, GLTextureFormatStuffRGBA8 )
    : canvasRenderTarget;

  if ( import.meta.env.DEV ) {
    glTextureFilter( ( postTarget as BufferTextureRenderTarget ).texture, GL_NEAREST );
  }

  const postStack = new PostStack( {
    input: mixerTarget,
    target: postTarget,
  } );

  dog.root.children.push( mixer, postStack );

  if ( import.meta.env.DEV ) {
    const { HistogramScatter } = await import( './nodes/HistogramScatter/HistogramScatter' );
    const { RTInspector } = await import( './nodes/RTInspector/RTInspector' );
    const { ComponentLogger } = await import( './nodes/ComponentLogger/ComponentLogger' );

    const blit = new Blit( {
      src: postTarget as BufferTextureRenderTarget,
      dst: canvasRenderTarget,
    } );
    dog.root.children.push( blit );

    const histogramScatter = new HistogramScatter( {
      input: postTarget as BufferTextureRenderTarget,
      target: canvasRenderTarget,
      active: false,
    } );
    dog.root.children.push( histogramScatter );

    promiseGui.then( ( gui ) => (
      gui.input( 'HistogramScatter/active', false )?.on( 'change', ( { value } ) => {
        histogramScatter.active = value;
      } )
    ) );

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
