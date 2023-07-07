import { CanvasTexture } from '../utils/CanvasTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { createPromiseSVGImage } from '../../utils/createPromiseSVGImage';
import { ditherFrag } from './shaders/ditherFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { noiseFrag } from './shaders/noiseFrag';
import { postTarget } from '../../globals/postTarget';
import { preparationProgressObservers, resizeObservers } from '../../globals/globalObservers';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { textureFrag } from '../../shaders/common/textureFrag';
import flyerSvg from './assets/flyer.svg?raw';

export class LoadingScreen extends SceneNode {
  public constructor() {
    super();

    const target = postTarget;

    // -- svg ------------------------------------------------------------------------------------------
    const imageFlyers: HTMLImageElement[] = [];
    let currentSvg = flyerSvg;

    arraySerial( 27 ).map( ( i ) => {
      currentSvg = currentSvg.replace( `id="${ 26 - i }"`, 'display="none"' );

      createPromiseSVGImage( currentSvg ).then( ( image ) => {
        imageFlyers[ 26 - i ] = image;
      } );
    } );

    // -- texture ----------------------------------------------------------------------------------
    let w = 4;
    let h = 4;
    let frame = 0;

    const flyerTexture = new CanvasTexture( w, h );

    const { context } = flyerTexture;

    const updateTexture = (): void => {
      context.fillStyle = '#000';
      context.fillRect( 0, 0, w, h );

      context.scale( 1, -1 );
      context.drawImage( imageFlyers[ frame % 27 ], w / 2 - h / 3, 0, h / 3 * 2, -h );

      flyerTexture.updateTexture();
    };

    resizeObservers.push( ( [ width, height ] ) => {
      w = width;
      h = height;

      flyerTexture.resize( w, h );
      updateTexture();
    } );

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      textureFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, flyerTexture.texture );

    // -- quad -------------------------------------------------------------------------------------
    const quad = new Quad( {
      target,
      material,
    } );

    // -- material - noise -------------------------------------------------------------------------
    const materialNoise = new Material(
      quadVert,
      noiseFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/noiseFrag',
        ( { noiseFrag } ) => {
          materialNoise.replaceShader( undefined, noiseFrag );
        },
      );
    }

    // -- quad - noise -----------------------------------------------------------------------------
    const quadNoise = new Quad( {
      target,
      active: false,
      material: materialNoise,
      range: [ -8.8 / 24.0, -16.7 / 24.0, 8.8 / 24.0, 1.7 / 24.0 ],
    } );

    // -- material - dither ------------------------------------------------------------------------
    const materialDither = new Material(
      quadVert,
      ditherFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/ditherFrag',
        ( { ditherFrag } ) => {
          materialDither.replaceShader( undefined, ditherFrag );
        },
      );
    }

    // -- quad - dither ----------------------------------------------------------------------------
    const quadDither = new Quad( {
      target,
      active: false,
      material: materialDither,
      range: [ 2.7 / 24.0, -18.9 / 24.0, 8.8 / 24.0, -17.8 / 24.0 ],
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      quad,
      quadNoise,
      quadDither,
    ];

    // -- updater ----------------------------------------------------------------------------------
    preparationProgressObservers.push( ( progress ) => {
      frame = ~~( progress * 27.0 );

      quadNoise.active = frame > 10;
      quadDither.active = frame > 23;
      updateTexture();

      this.active = frame !== 27;
    } );

    // -- don't show in dev mode -------------------------------------------------------------------
    if ( import.meta.env.DEV ) {
      this.active = false;
    }
  }
}
