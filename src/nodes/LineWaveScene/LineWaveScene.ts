import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { lineWaveVert } from './shaders/lineWaveVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineWaveScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( lineWaveVert, 512, 512 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineWaveVert',
        ( { lineWaveVert } ) => {
          lines.materials.deferred!.replaceShader( lineWaveVert );
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
      [ 0.0, -0.8, 0.8 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lines,
      camera,
    ];
  }
}
