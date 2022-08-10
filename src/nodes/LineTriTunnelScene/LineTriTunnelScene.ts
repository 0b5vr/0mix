import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { lineTriTunnelVert } from './shaders/lineTriTunnelVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineTriTunnelScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( lineTriTunnelVert, 4, 512 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineTriTunnelVert',
        ( { lineTriTunnelVert } ) => {
          lines.materials.deferred!.replaceShader( lineTriTunnelVert );
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
