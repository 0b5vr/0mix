import { CameraStack } from './nodes/CameraStack/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { CubemapNode } from './nodes/CubemapNode/CubemapNode';
import { Dog } from './heck/Dog';
import { FUI } from './nodes/FUI/FUI';
import { Floor } from './nodes/Floor/Floor';
import { IBLLUTCalc } from './nodes/IBLLUTCalc/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { Lights } from './nodes/Lights/Lights';
import { Dust } from './nodes/Dust/Dust';
import { RawVector3, vecAdd } from '@0b5vr/experimental';
import { Sponge } from './nodes/Sponge/Sponge';
import { VRCameraStack } from './nodes/CameraStack/VRCameraStack';
import { auto, automaton } from './globals/automaton';
import { canvas, gl } from './globals/canvas';
import { createVRSesh } from './globals/createVRSesh';
import { music } from './globals/music';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';

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
    const webglMemory = gl.getExtension( 'GMAN_webgl_memory' );

    if ( webglMemory ) {
      gui.input( 'webgl-memory/enabled', false );

      dog.root.children.push( new Lambda( {
        onUpdate: () => {
          if ( gui.value( 'webgl-memory/enabled' ) ) {
            const info = webglMemory.getMemoryInfo();

            gui.monitor(
              'webgl-memory/buffer',
              `${ info.resources.buffer } / ${ ( info.memory.buffer * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/texture',
              `${ info.resources.texture } / ${ ( info.memory.texture * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/renderbuffer',
              `${ info.resources.renderbuffer } / ${ ( info.memory.renderbuffer * 1E-6 ).toFixed( 3 ) } MB`,
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
              `${ ( info.memory.drawingbuffer * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/total',
              `${ ( info.memory.total * 1E-6 ).toFixed( 3 ) } MB`,
            );
          }
        },
      } ) );
    }
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

export const tagMainCamera = Symbol();

const iblLutCalc = new IBLLUTCalc();

const lights = new Lights( dog.root );

const floor = new Floor();

const dust = new Dust();

const cubemapNode = new CubemapNode( {
  scene: dog.root,
} );

if ( import.meta.env.DEV ) {
  cubemapNode.name = 'cubemapNode';
}

const cameraStackOptions = {
  scene: dog.root,
  floor,
  withAO: true,
  withPost: true,
  tags: [ tagMainCamera ],
};

// const plane = new Plane();
// plane.transform.position = [ 0.0, 3.0, 5.0 ];
// plane.transform.scale = [ 1.0, 1.0, 1.0 ];

const fui = new FUI();

const sponge = new Sponge();

dog.root.children.push(
  iblLutCalc,
  fui,
  floor,
  sponge,
  lights,
  dust,
  cubemapNode,
  // plane,
);

// -- desktop --------------------------------------------------------------------------------------
export async function initDesktop( width: number, height: number ): Promise<void> {
  canvas.width = width;
  canvas.height = height;

  const canvasRenderTarget = new CanvasRenderTarget();

  const cameraStack = new CameraStack( {
    width,
    height,
    ...cameraStackOptions,
    target: canvasRenderTarget,
  } );

  if ( import.meta.env.DEV ) {
    cameraStack.name = 'cameraStack';
  }

  dog.root.children.push(
    new Lambda( {
      name: import.meta.env.DEV ? 'cameraLambda' : undefined,
      onUpdate: ( { time } ) => {
        const shake = auto( 'camera/shake' );

        const posR = auto( 'camera/pos/r' );
        const posP = auto( 'camera/pos/p' );
        const posT = auto( 'camera/pos/t' );
        const pos = vecAdd(
          [
            auto( 'camera/pos/x' ),
            auto( 'camera/pos/y' ),
            auto( 'camera/pos/z' ),
          ],
          [
            posR * Math.cos( posT ) * Math.sin( posP ),
            posR * Math.sin( posT ),
            posR * Math.cos( posT ) * Math.cos( posP ),
          ],
          [
            0.04 * shake * Math.sin( time * 2.4 ),
            0.04 * shake * Math.sin( time * 3.4 ),
            0.04 * shake * Math.sin( time * 2.7 ),
          ],
        ) as RawVector3;

        const tar = vecAdd(
          [
            auto( 'camera/tar/x' ),
            auto( 'camera/tar/y' ),
            auto( 'camera/tar/z' ),
          ],
          [
            0.04 * shake * Math.sin( time * 2.8 ),
            0.04 * shake * Math.sin( time * 2.5 ),
            0.04 * shake * Math.sin( time * 3.1 ),
          ],
        ) as RawVector3;

        const roll = auto( 'camera/roll' ) + 0.01 * shake * Math.sin( time * 1.1 );

        cameraStack.fov = auto( 'camera/fov' );
        cameraStack.transform.lookAt( pos, tar, [ 0.0, 1.0, 0.0 ], roll );
      },
    } ),
    cameraStack,
  );

  if ( import.meta.env.DEV ) {
    import( './nodes/RTInspector/RTInspector' ).then( ( { RTInspector } ) => {
      const rtInspector = new RTInspector( {
        target: canvasRenderTarget,
      } );
      dog.root.children.push( rtInspector );
    } );
  }

  const update = function(): void {
    if ( import.meta.env.DEV ) {
      // vr
      if ( !cameraStack.active ) {
        return;
      }
    }

    dog.update();

    requestAnimationFrame( update );
  };

  update();
}

// -- vr -------------------------------------------------------------------------------------------
export async function initVR(): Promise<void> {
  const vrSesh = await createVRSesh();

  const vrCameraStack = new VRCameraStack( {
    ...cameraStackOptions,
    vrSesh,
    dog,
  } );
  vrCameraStack.transform.position = [ 0.0, 0.0, 5.0 ];

  if ( import.meta.env.DEV ) {
    vrCameraStack.name = 'vrCameraStack';

    const existingCameraStack = dog.root.children.find( ( compo ) => compo.name === 'cameraStack' );
    if ( existingCameraStack ) {
      existingCameraStack.active = false;
    }
  }

  dog.root.children.push(
    vrCameraStack,
  );
}

if ( import.meta.env.DEV ) {
  promiseGui.then( ( gui ) => {
    gui.button( 'vr (what)' ).on( 'click', initVR );
  } );
}
