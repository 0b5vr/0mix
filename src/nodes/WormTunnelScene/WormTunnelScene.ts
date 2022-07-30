import { CameraStack } from '../CameraStack/CameraStack';
import { EventType, emit } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { WormTunnel } from './WormTunnel/WormTunnel';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class WormTunnelScene extends SceneNode {
  public cameraProxy: SceneNode;

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

    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ -0.0, -0.0, 3.0 ],
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.Camera, {
          dof: [ 4.0, 5.0 ],
          fog: [ 20.0, 5.0, 20.0 ],
        } );
        emit( EventType.CubeMap );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    this.children = [
      lightRim,
      lightFront,
      tunnel,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
