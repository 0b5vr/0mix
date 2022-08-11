import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { Dust } from '../Dust/Dust';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { Sponge } from './Sponge/Sponge';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { quatFromAxisAngle } from '@0b5vr/experimental';
import { swapShadowMap1, swapShadowMap2, swapShadowMap3 } from '../../globals/swapShadowMap';

export class SpongeScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    const lightL = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 60.0,
    } );
    lightL.transform.lookAt( [ -6.0, 0.0, 0.0 ] );
    lightL.color = [ 10.0, 30.0, 40.0 ];

    const lightR = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 60.0,
    } );
    lightR.transform.lookAt( [ 5.0, 0.0, -2.0 ] );
    lightR.color = [ 50.0, 50.0, 50.0 ];

    const lightF = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap3,
      shadowMapFov: 60.0,
    } );
    lightF.transform.lookAt( [ 1.0, 1.0, 7.0 ] );
    lightF.color = [ 10.0, 10.0, 10.0 ];

    if ( import.meta.env.DEV ) {
      lightL.name = 'lightL';
      lightR.name = 'lightR';
      lightF.name = 'lightF';
    }

    const sponge = new Sponge();

    const dust = new Dust();
    dust.transform.scale = [ 3.0, 3.0, 3.0 ];

    const lambdaSpeen = new Lambda( {
      onUpdate( { time } ) {
        sponge.transform.rotation = quatFromAxisAngle( [ 0.0, 1.0, 0.0 ], 0.1 * time );
        dust.transform.rotation = quatFromAxisAngle( [ 0.0, 1.0, 0.0 ], 0.1 * time );
      },
    } );

    const cubemapNode = new CubemapNode( {
      scene,
    } );

    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 1.0, 24.0 ],
      cubemapNode,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.2, 2.0 ],
      [ 0.0, 0.0, 0.0 ],
      0.4,
    );

    this.children = [
      lambdaSpeen,
      lightL,
      lightR,
      lightF,
      sponge,
      dust,
      cubemapNode,
      camera,
    ];
  }
}
