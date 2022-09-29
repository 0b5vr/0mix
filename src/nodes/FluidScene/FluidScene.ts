import { CameraStack } from '../CameraStack/CameraStack';
import { Fluid } from './Fluid';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class FluidScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // == lights ===================================================================================
    const light = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light.transform.lookAt( [ 3.0, 3.0, 3.0 ], [ 0.0, 0.0, 0.0 ] );
    light.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      light.name = 'light';
    }

    // == fluid ====================================================================================
    const fluid = new Fluid();

    // == camera ===================================================================================
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 1.0 ],
      [ 0.0, 0.0, 0.0 ],
      -0.0,
    );

    // == children =================================================================================
    this.children = [
      light,
      fluid,
      camera,
    ];
  }
}
