import { CameraStack } from '../CameraStack/CameraStack';
import { InstancedLines } from '../utils/InstancedLines';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { lineRhombusesVert } from './shaders/lineRhombusesVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineRhombusesScene extends SceneNode {
  public constructor() {
    super();

    // -- lines ------------------------------------------------------------------------------------
    const lines = new InstancedLines( lineRhombusesVert, 5, 800 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineRhombusesVert',
        ( { lineRhombusesVert } ) => {
          lines.materials.deferred!.replaceShader( lineRhombusesVert );
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
