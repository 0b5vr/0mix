import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { lineRings3DVert } from './shaders/lineRings3DVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineRings3DScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( lineRings3DVert, 256, 300 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineRings3DVert',
        ( { lineRings3DVert } ) => {
          lines.materials.deferred!.replaceShader( lineRings3DVert );
        }
      );
    }

    // -- camera proxy -----------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene: this,
      resources: mainCameraStackResources,
      target: cameraStackBTarget,
      fog: [ 0.0, 2.0, 10.0 ],
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lines,
      camera,
    ];
  }
}
