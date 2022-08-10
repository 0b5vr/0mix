import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { lineRingsVert } from './shaders/lineRingsVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineRingsScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( lineRingsVert, 512, 256 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineRingsVert',
        ( { lineRingsVert } ) => {
          lines.materials.deferred!.replaceShader( lineRingsVert );
        }
      );
    }

    // -- camera proxy -----------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene: this,
      resources: mainCameraStackResources,
      target: cameraStackBTarget,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 5.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lines,
      camera,
    ];
  }
}
