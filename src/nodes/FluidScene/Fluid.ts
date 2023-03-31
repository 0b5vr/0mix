import { BUFFER_RESO } from './constants';
import { Blit } from '../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffR16F, GLTextureFormatStuffRGBA16F } from '../../gl/glSetTexture';
import { GL_NEAREST, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap, arraySerial } from '@0b5vr/experimental';
import { auto } from '../../globals/automaton';
import { colorFrag } from '../../shaders/common/colorFrag';
import { createRaymarchCameraUniformsLambda } from '../utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { fluidAdvectionFrag } from './shaders/fluidAdvectionFrag';
import { fluidCurlFrag } from './shaders/fluidCurlFrag';
import { fluidDivergenceFrag } from './shaders/fluidDivergenceFrag';
import { fluidPokeDensityFrag } from './shaders/fluidPokeDensityFrag';
import { fluidPressureFrag } from './shaders/fluidPressureFrag';
import { fluidRenderFrag } from './shaders/fluidRenderFrag';
import { fluidResolvePressureFrag } from './shaders/fluidResolvePressureFrag';
import { genCube } from '../../geometries/genCube';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { music } from '../../globals/music';
import { objectVert } from '../../shaders/common/objectVert';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export class Fluid extends SceneNode {
  public forward: Material;

  public constructor() {
    super();

    // -- render targets ---------------------------------------------------------------------------
    const bufferCurl = new BufferTextureRenderTarget(
      BUFFER_RESO,
      BUFFER_RESO,
      1,
      GLTextureFormatStuffRGBA16F,
    );
    const bufferDivergence = new BufferTextureRenderTarget(
      BUFFER_RESO,
      BUFFER_RESO,
      1,
      GLTextureFormatStuffR16F,
    );
    const swapPressure = new Swap(
      new BufferTextureRenderTarget( BUFFER_RESO, BUFFER_RESO, 1, GLTextureFormatStuffR16F ),
      new BufferTextureRenderTarget( BUFFER_RESO, BUFFER_RESO, 1, GLTextureFormatStuffR16F ),
    );
    const swapDensity = new Swap(
      new BufferTextureRenderTarget( BUFFER_RESO, BUFFER_RESO, 1, GLTextureFormatStuffRGBA16F ),
      new BufferTextureRenderTarget( BUFFER_RESO, BUFFER_RESO, 1, GLTextureFormatStuffRGBA16F ),
    );

    glTextureFilter( bufferCurl.texture, GL_NEAREST );
    glTextureFilter( bufferDivergence.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      bufferCurl.name = 'Fluid/bufferCurl';
      bufferDivergence.name = 'Fluid/bufferDivergence';
      swapPressure.i.name = 'Fluid/swapPressure/0';
      swapPressure.o.name = 'Fluid/swapPressure/1';
      swapDensity.i.name = 'Fluid/swapDensity/0';
      swapDensity.o.name = 'Fluid/swapDensity/1';
    }

    // -- poke density -----------------------------------------------------------------------------
    const materialPokeDensity = new Material(
      quadVert,
      fluidPokeDensityFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialPokeDensity.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/fluidPokeDensityFrag', ( { fluidPokeDensityFrag } ) => {
        materialPokeDensity.replaceShader( undefined, fluidPokeDensityFrag );
      } );
    }

    const quadPokeDensity = new Quad( {
      target: swapDensity.i,
      material: materialPokeDensity,
    } );

    swapDensity.swap();

    // -- curl -------------------------------------------------------------------------------------
    const materialCurl = new Material(
      quadVert,
      fluidCurlFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialCurl.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    const quadCurl = new Quad( {
      target: bufferCurl,
      material: materialCurl,
    } );

    // -- divergence -------------------------------------------------------------------------------
    const materialDivergence = new Material(
      quadVert,
      fluidDivergenceFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialDivergence.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    const quadDivergence = new Quad( {
      target: bufferDivergence,
      material: materialDivergence,
    } );

    // -- pressure ---------------------------------------------------------------------------------
    const materialPressureInit = new Material(
      quadVert,
      colorFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialPressureInit.addUniform( 'color', '4f', 0.5, 0.0, 0.0, 1.0 );

    const quadPressureInit = new Quad( {
      target: swapPressure.i,
      material: materialPressureInit,
    } );

    swapPressure.swap();

    const quadPressures = arraySerial( 20 ).map( () => {
      const material = new Material(
        quadVert,
        fluidPressureFrag,
        {
          initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
        },
      );
      material.addUniformTextures(
        'samplerDivergence',
        GL_TEXTURE_2D,
        bufferDivergence.texture,
      );
      material.addUniformTextures(
        'samplerPressure',
        GL_TEXTURE_2D,
        swapPressure.o.texture,
      );

      const quad = new Quad( {
        target: swapPressure.i,
        material,
      } );

      swapPressure.swap();

      return quad;
    } );

    // -- resolve pressure -------------------------------------------------------------------------
    const materialResolvePressure = new Material(
      quadVert,
      fluidResolvePressureFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialResolvePressure.addUniformTextures(
      'samplerCurl',
      GL_TEXTURE_2D,
      bufferCurl.texture,
    );
    materialResolvePressure.addUniformTextures(
      'samplerPressure',
      GL_TEXTURE_2D,
      swapPressure.o.texture,
    );
    materialResolvePressure.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    const quadResolvePressure = new Quad( {
      target: swapDensity.i,
      material: materialResolvePressure,
    } );

    swapDensity.swap();

    // -- advection --------------------------------------------------------------------------------
    const materialAdvectionVelocity = new Material(
      quadVert,
      fluidAdvectionFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );
    materialAdvectionVelocity.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    const quadAdvectionVelocity = new Quad( {
      target: swapDensity.i,
      material: materialAdvectionVelocity,
    } );

    swapDensity.swap();

    // -- blit back --------------------------------------------------------------------------------
    const blitDensity = new Blit( {
      src: swapDensity.o,
      dst: swapDensity.i,
    } );

    swapDensity.swap();

    // -- render -----------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const forward = this.forward = new Material(
      objectVert,
      fluidRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );
    forward.addUniformTextures(
      'samplerDensity',
      GL_TEXTURE_2D,
      swapDensity.o.texture,
    );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [ forward ] );

    const mesh = new Mesh( {
      geometry,
      materials: { forward },
    } );
    mesh.depthTest = false;
    mesh.depthWrite = false;

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/fluidRenderFrag', ( { fluidRenderFrag } ) => {
        forward.replaceShader( undefined, fluidRenderFrag );
      } );
    }

    /// -- lambda to say update --------------------------------------------------------------------
    auto( 'Fluid/update', () => {
      const { time, deltaTime } = music;

      quadPokeDensity.drawImmediate( { time, deltaTime } );
      quadCurl.drawImmediate( { time, deltaTime } );
      quadDivergence.drawImmediate( { time, deltaTime } );
      quadPressureInit.drawImmediate( { time, deltaTime } );
      quadPressures.map( ( quad ) => quad.drawImmediate( { time, deltaTime } ) );
      quadResolvePressure.drawImmediate( { time, deltaTime } );
      quadAdvectionVelocity.drawImmediate( { time, deltaTime } );
      blitDensity.blitImmediate();
    } );

    // -- names ------------------------------------------------------------------------------------
    if ( import.meta.env.DEV ) {
      quadPokeDensity.name = 'quadPokeDensity';
      quadCurl.name = 'quadCurl';
      quadDivergence.name = 'quadDivergence';
      quadPressureInit.name = 'quadPressureInit';
      quadPressures.map( ( quad, i ) => quad.name = `quadPressures${ i }` );
      quadResolvePressure.name = 'quadResolvePressure';
      quadAdvectionVelocity.name = 'quadAdvectionVelocity';
      lambdaRaymarchCameraUniforms.name = 'lambdaRaymarchCameraUniforms';
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaRaymarchCameraUniforms,
      mesh,
    ];
  }
}
