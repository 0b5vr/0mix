import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { wireCubeVert } from './shaders/wireCubeVert';

export class WireCubeScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( wireCubeVert, 2, 12 * 20 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/wireCubeVert',
        ( { wireCubeVert } ) => {
          lines.materials.deferred!.replaceShader( wireCubeVert );
        }
      );
    }

    // -- camera proxy -----------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene: this,
      resources: mainCameraStackResources,
      target: cameraStackBTarget,
      fog: [ 0.0, 3.0, 7.0 ],
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lines,
      camera,
    ];
  }
}
