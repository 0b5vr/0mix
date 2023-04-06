import { Blit } from './heck/components/Blit';
import { BufferTextureRenderTarget } from './heck/BufferTextureRenderTarget';
import { CapsuleScene } from './nodes/CapsuleScene/CapsuleScene';
import { Capture } from './nodes/Capture/Capture';
import { Dog } from './heck/Dog';
import { FluidScene } from './nodes/FluidScene/FluidScene';
import { IcosahedronScene } from './nodes/IcosahedronScene/IcosahedronScene';
import { InkScene } from './nodes/InkScene/InkScene';
import { KansokushaScene } from './nodes/KansokushaScene/KansokushaScene';
import { KeyboardScene } from './nodes/KeyboardScene/KeyboardScene';
import { Lambda } from './heck/components/Lambda';
import { LineRhombusesScene } from './nodes/LineRhombusesScene/LineRhombusesScene';
import { LineRings3DScene } from './nodes/LineRings3DScene/LineRings3DScene';
import { LineRingsScene } from './nodes/LineRingsScene/LineRingsScene';
import { LineTriTunnelScene } from './nodes/LineTriTunnelScene/LineTriTunnelScene';
import { LineWaveScene } from './nodes/LineWaveScene/LineWaveScene';
import { LoadingScreen } from './nodes/LoadingScreen/LoadingScreen';
import { MUSIC_BPM } from './config';
import { MetaballScene } from './nodes/MetaballScene/MetaballScene';
import { MetalCubeScene } from './nodes/MetalCubeScene/MetalCubeScene';
import { Mixer } from './nodes/Mixer/Mixer';
import { MoonScene } from './nodes/MoonScene/MoonScene';
import { NoisePlaneScene } from './nodes/NoisePlaneScene/NoisePlaneScene';
import { OBSVRLogoBScene } from './nodes/OBSVRLogoBScene/OBSVRLogoBScene';
import { OBSVRLogoScene } from './nodes/OBSVRLogoScene/OBSVRLogoScene';
import { OctreeTunnelScene } from './nodes/OctreeTunnelScene/OctreeTunnelScene';
import { ParticlesRingScene } from './nodes/ParticlesRingScene/ParticlesRingScene';
import { PillarGridScene } from './nodes/PillarGridScene/PillarGridScene';
import { PinArrayScene } from './nodes/PinArrayScene/PinArrayScene';
import { PlexusScene } from './nodes/PlexusScene/PlexusScene';
import { PostStack } from './nodes/PostStack/PostStack';
import { RieScene } from './nodes/RieScene/RieScene';
import { Section2Scene } from './nodes/Section2Scene/Section2Scene';
import { SevenSegScene } from './nodes/SevenSegScene/SevenSegScene';
import { SpongeScene } from './nodes/SpongeScene/SpongeScene';
import { TrailsScene } from './nodes/TrailsScene/TrailsScene';
import { TruchetScene } from './nodes/TruchetScene/TruchetScene';
import { WebGLMemory } from './nodes/WebGLMemory/WebGLMemory';
import { WormTunnelScene } from './nodes/WormTunnelScene/WormTunnelScene';
import { auto, automaton } from './globals/automaton';
import { cameraStackATarget, cameraStackBTarget } from './globals/cameraStackTargets';
import { canvas } from './globals/canvas';
import { canvasRenderTarget } from './globals/canvasRenderTarget';
import { ibllutCalc } from './globals/ibllutCalc';
import { mixerTarget } from './globals/mixerTarget';
import { moonTexGen } from './globals/moonTexGen';
import { music } from './globals/music';
import { postTarget } from './globals/postTarget';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';
import { resizeObservers } from './globals/globalObservers';
import { updateAudioAnalyzer } from './globals/audioAnalyzer';

// == dog ==========================================================================================
export const dog = new Dog();

// loading screen
const loadingScene = new LoadingScreen();

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
      updateAudioAnalyzer();
    },
    name: 'audioAnalyzer',
  } ) );

  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      automaton.update( MUSIC_BPM / 60.0 * music.time );
    },
    name: 'automaton',
  } ) );

  dog.root.children.push( new WebGLMemory() );
} else {
  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      randomTexture.update();
      music.update();
      updateAudioAnalyzer();
      automaton.update( MUSIC_BPM / 60.0 * music.time );
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
  new IcosahedronScene(),
  new FluidScene(),
  new OBSVRLogoScene(),
  new TruchetScene(),
  new MoonScene(),
  new SevenSegScene(),
  new KeyboardScene(),
  new RieScene(),
  new InkScene(),
  new CapsuleScene(),
  new MetalCubeScene(),
  new PinArrayScene(),
  new Section2Scene(),
];

const scenesB = [
  new LineWaveScene(),
  new LineRingsScene(),
  new LineTriTunnelScene(),
  new PlexusScene(),
  new NoisePlaneScene(),
  new KansokushaScene(),
  new LineRings3DScene(),
  new OBSVRLogoBScene(),
  new LineRhombusesScene(),
];

dog.root.children.push(
  ibllutCalc,
  moonTexGen,
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

// == post =========================================================================================
const mixer = new Mixer( {
  inputA: cameraStackATarget,
  inputB: cameraStackBTarget,
  target: mixerTarget,
} );

const postStack = new PostStack( {
  input: mixerTarget,
  target: postTarget,
} );

dog.root.children.push( mixer, postStack );

// == loading scene, again =========================================================================
dog.root.children.push( loadingScene );

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
resizeObservers.push( ( [ width, height ] ) => {
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
