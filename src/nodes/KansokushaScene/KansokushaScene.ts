import { CanvasTexture } from '../utils/CanvasTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { createPromiseSVGImage } from '../../utils/createPromiseSVGImage';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { kansokushaFrag } from './shaders/kansokushaFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { resizeObservers } from '../../globals/globalObservers';
import kansokushaSvg from './assets/kansokusha.svg?raw';

export class KansokushaScene extends SceneNode {
  public constructor() {
    super();

    // -- canvas -----------------------------------------------------------------------------------
    const texture = new CanvasTexture( 4, 4 );
    const { context } = texture;

    resizeObservers.push( ( [ _, h ] ) => {
      texture.resize( h, h / 3 );
      texture.clear();

      createPromiseSVGImage( kansokushaSvg ).then( ( image ) => {
        context.drawImage( image, 0, 0, h, h / 3 );
        texture.updateTexture();
      } );
    } );

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      kansokushaFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/kansokushaFrag',
        ( { kansokushaFrag } ) => {
          material.replaceShader( undefined, kansokushaFrag );
        },
      );
    }

    // -- quad -------------------------------------------------------------------------------------
    const quad = new Quad( {
      target: cameraStackBTarget,
      material,
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      quad,
    ];
  }
}
