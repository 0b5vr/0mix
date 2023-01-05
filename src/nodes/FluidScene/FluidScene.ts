import { CameraStack } from '../CameraStack/CameraStack';
import { Fluid } from './Fluid';
import { GL_TEXTURE_2D } from '../../gl/constants';
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
    const lightF = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightF.transform.lookAt( [ 0.0, -2.0, 3.0 ], [ 0.0, 0.0, 0.0 ] );
    lightF.color = [ 20.0, 20.0, 20.0 ];

    const lightR = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightR.transform.lookAt( [ 0.0, 3.0, -2.0 ], [ 0.0, 0.0, 0.0 ] );
    lightR.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      lightF.name = 'lightF';
      lightR.name = 'lightR';
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
      0.0,
    );

    fluid.forward.addUniformTextures(
      'samplerDeferredPos',
      GL_TEXTURE_2D,
      mainCameraStackResources[ 0 ].textures[ 1 ],
    );

    // == children =================================================================================
    this.children = [
      lightF,
      lightR,
      fluid,
      camera,
    ];
  }
}
