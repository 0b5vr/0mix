import { Blit } from './heck/components/Blit';
import { BufferTextureRenderTarget } from './heck/BufferTextureRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Capture } from './nodes/Capture/Capture';
import { Dog } from './heck/Dog';
import { EventType, on } from './globals/globalEvent';
import { FluidScene } from './nodes/FluidScene/FluidScene';
import { GLTextureFormatStuffRGBA8 } from './gl/glSetTexture';
import { GL_NEAREST } from './gl/constants';
import { IBLLUTCalc } from './nodes/IBLLUTCalc/IBLLUTCalc';
import { KansokushaScene } from './nodes/KansokushaScene/KansokushaScene';
import { KeyboardScene } from './nodes/KeyboardScene/KeyboardScene';
import { Lambda } from './heck/components/Lambda';
import { LineRingsScene } from './nodes/LineRingsScene/LineRingsScene';
import { LineTriTunnelScene } from './nodes/LineTriTunnelScene/LineTriTunnelScene';
import { LineWaveScene } from './nodes/LineWaveScene/LineWaveScene';
import { MetaballScene } from './nodes/MetaballScene/MetaballScene';
import { Mixer } from './nodes/Mixer/Mixer';
import { MoonScene } from './nodes/MoonScene/MoonScene';
import { NoisePlaneScene } from './nodes/NoisePlaneScene/NoisePlaneScene';
import { OBSVRLogoScene } from './nodes/OBSVRLogoScene/OBSVRLogoScene';
import { OctreeTunnelScene } from './nodes/OctreeTunnelScene/OctreeTunnelScene';
import { ParticlesRingScene } from './nodes/ParticlesRingScene/ParticlesRingScene';
import { PillarGridScene } from './nodes/PillarGridScene/PillarGridScene';
import { PlexusScene } from './nodes/PlexusScene/PlexusScene';
import { PostStack } from './nodes/PostStack/PostStack';
import { SevenSegScene } from './nodes/SevenSegScene/SevenSegScene';
import { SphereArrayScene } from './nodes/SphereArrayScene/SphereArrayScene';
import { SpongeScene } from './nodes/SpongeScene/SpongeScene';
import { TrailsScene } from './nodes/TrailsScene/TrailsScene';
import { TruchetScene } from './nodes/TruchetScene/TruchetScene';
import { WebGLMemory } from './nodes/WebGLMemory/WebGLMemory';
import { WormTunnelScene } from './nodes/WormTunnelScene/WormTunnelScene';
import { auto, automaton } from './globals/automaton';
import { cameraStackATarget, cameraStackBTarget } from './globals/cameraStackTargets';
import { canvas } from './globals/canvas';
import { glTextureFilter } from './gl/glTextureFilter';
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

    gui.button( 'Fullscreen' ).on( 'click', () => {
      canvas.requestFullscreen();
    } );
  } );
}

// == nodes =====================================================================================
// const plane = new Plane();
// dog.root.children.push( plane );

const iblLutCalc = new IBLLUTCalc();

// const plane = new Plane();
// plane.transform.position = [ 0.0, 3.0, 5.0 ];
// plane.transform.scale = [ 1.0, 1.0, 1.0 ];

const scenesA = [
  new SpongeScene(),
  new WormTunnelScene(),
  new PillarGridScene(),
  new MetaballScene(),
  new TrailsScene(),
  new OctreeTunnelScene(),
  new ParticlesRingScene(),
  new SphereArrayScene(),
  new FluidScene(),
  new OBSVRLogoScene(),
  new TruchetScene(),
  new MoonScene(),
  new SevenSegScene(),
  new KeyboardScene(),
];

const scenesB = [
  new LineWaveScene(),
  new LineRingsScene(),
  new LineTriTunnelScene(),
  new PlexusScene(),
  new NoisePlaneScene(),
  new KansokushaScene(),
];

dog.root.children.push(
  iblLutCalc,
  ...scenesA,
  ...scenesB,
  // plane,
);

auto( 'A', ( { value } ) => {
  scenesA.map( ( scene, i ) => scene.active = value === i + 1 );
} );

auto( 'B', ( { value } ) => {
  scenesB.map( ( scene, i ) => scene.active = value === i + 1 );
} );

// == camera =======================================================================================
const mixerTarget = new BufferTextureRenderTarget( 4, 4 );

const canvasRenderTarget = new CanvasRenderTarget();

// == post =========================================================================================
const mixer = new Mixer( {
  inputA: cameraStackATarget,
  inputB: cameraStackBTarget,
  target: mixerTarget,
} );

const postTarget = import.meta.env.DEV
  ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA8 )
  : canvasRenderTarget;

if ( import.meta.env.DEV ) {
  glTextureFilter( ( postTarget as BufferTextureRenderTarget ).texture, GL_NEAREST );
}

const postStack = new PostStack( {
  input: mixerTarget,
  target: postTarget,
} );

dog.root.children.push( mixer, postStack );

// == dev specific =================================================================================
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

  const capture = new Capture();
  dog.root.children.push( capture );

  // component logger must be last
  const componentLogger = new ComponentLogger();
  dog.root.children.push( componentLogger );
}

// == update =======================================================================================
const update = function(): void {
  dog.update();

  requestAnimationFrame( update );
};

update();

// == resize handler ===============================================================================
on( EventType.Resize, ( [ width, height ] ) => {
  canvas.width = width;
  canvas.height = height;
  canvasRenderTarget.viewport = [ 0, 0, width, height ];

  cameraStackATarget.resize( width, height );
  cameraStackBTarget.resize( width, height );
  mixerTarget.resize( width, height );

  if ( import.meta.env.DEV ) {
    ( postTarget as BufferTextureRenderTarget ).resize( width, height );
  }
} );
