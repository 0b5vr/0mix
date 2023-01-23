import { CanvasTexture } from '../utils/CanvasTexture';
import { EventType, on } from '../../globals/globalEvent';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { textureFrag } from '../../shaders/common/textureFrag';
import kansokushaSvg from './assets/kansokusha.svg?raw';

export class KansokushaScene extends SceneNode {
  public constructor() {
    super();

    // -- svg --------------------------------------------------------------------------------------
    const imageFill = new Image();
    const imageStroke = new Image();

    imageFill.src = `data:image/svg+xml;charset=utf8,${ encodeURIComponent( kansokushaSvg ) }`;
    imageStroke.src = `data:image/svg+xml;charset=utf8,${ encodeURIComponent( kansokushaSvg.replace( 'fill', 'stroke' ) ) }`;

    // -- canvas -----------------------------------------------------------------------------------
    const texture = new CanvasTexture( 4, 4 );
    const { context } = texture;

    const lambdaUpdate = new Lambda( {
      onUpdate( { time } ) {
        texture.clear();

        const { width, height } = texture;

        arraySerial( 3 ).map( ( row ) => {
          arraySerial( 4 ).map( ( col ) => {
            const x = 0.5 * width
              + ( ( row % 2.0 - 0.5 ) * ( 0.5 * time % 2 - 3.0 + 2.0 * col ) - 0.5 ) * height;
            const y = height / 3 * row;

            const image = row + 3 * col === Math.floor( time % 1.0 * 20.0 )
              ? imageFill
              : imageStroke;
            context.drawImage( image, x, y, height, height / 3 );
          } );
        } );

        texture.updateTexture();
      },
    } );

    on( EventType.Resize, ( [ w, h ] ) => {
      texture.resize( w, h );
    } );

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      textureFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/noisePlaneFrag',
        ( { noisePlaneFrag } ) => {
          material.replaceShader( undefined, noisePlaneFrag );
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
      lambdaUpdate,
      quad,
    ];
  }
}
