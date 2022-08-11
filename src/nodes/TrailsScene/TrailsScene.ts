import { CameraStack } from '../CameraStack/CameraStack';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { Trails } from './Trails/Trails';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class TrailsScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
    } );
    light1.transform.lookAt( [ 3.0, 3.0, 3.0 ] );
    light1.color = [ 100.0, 100.0, 100.0 ];

    const trails = new Trails();

    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 1.0, 12.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 2.0 ],
      [ 0.0, 0.0, 0.0 ],
      -0.4
    );

    this.children = [
      light1,
      trails,
      camera,
    ];
  }
}
