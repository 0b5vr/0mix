import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { noisePlaneFrag } from './shaders/noisePlaneFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export class NoisePlaneScene extends SceneNode {
  public constructor() {
    super();

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      noisePlaneFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

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
      quad,
    ];
  }
}
