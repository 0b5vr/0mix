import { CameraStack } from '../CameraStack/CameraStack';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { WormTunnel } from './WormTunnel/WormTunnel';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class WormTunnelScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    const lightRim = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 10.0,
    } );
    lightRim.transform.lookAt( [ 0.0, 0.0, -10.0 ] );
    lightRim.color = [ 100.0, 100.0, 100.0 ];

    const lightFront = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 10.0,
    } );
    lightFront.transform.lookAt( [ 0.0, 0.0, 10.0 ] );
    lightFront.color = [ 20.0, 20.0, 20.0 ];

    if ( import.meta.env.DEV ) {
      lightRim.name = 'lightRim';
      lightFront.name = 'lightFront';
    }

    const tunnel = new WormTunnel();

    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      fog: [ 20.0, 5.0, 20.0 ],
      dofParams: [ 4.0, 16.0 ],
    } );
    camera.transform.lookAt(
      [ -0.0, -0.0, 3.0 ],
    );

    this.children = [
      lightRim,
      lightFront,
      tunnel,
      camera,
    ];
  }
}
