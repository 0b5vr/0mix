import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { obsvrLogoBFrag } from './shaders/obsvrLogoBFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export class OBSVRLogoBScene extends SceneNode {
  public constructor() {
    super();

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      obsvrLogoBFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/obsvrLogoBFrag',
        ( { obsvrLogoBFrag } ) => {
          material.replaceShader( undefined, obsvrLogoBFrag );
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
