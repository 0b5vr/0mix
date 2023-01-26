import { CanvasTexture } from '../utils/CanvasTexture';
import { EventType, on } from '../../globals/globalEvent';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { kansokushaFrag } from './shaders/kansokushaFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import kansokushaSvg from './assets/kansokusha.svg?raw';

export class KansokushaScene extends SceneNode {
  public constructor() {
    super();

    // -- svg --------------------------------------------------------------------------------------
    const image = new Image();

    image.src = `data:image/svg+xml;charset=utf8,${ encodeURIComponent( kansokushaSvg ) }`;

    // -- canvas -----------------------------------------------------------------------------------
    const texture = new CanvasTexture( 4, 4 );
    const { context } = texture;

    on( EventType.Resize, ( [ _, h ] ) => {
      texture.resize( h, h / 3 );
      texture.clear();

      context.drawImage( image, 0, 0 );

      texture.updateTexture();
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
