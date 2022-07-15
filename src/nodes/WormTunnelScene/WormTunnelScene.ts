import { NEAR, FAR } from '../../config';
import { emit, EventType } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';
import { CameraStack } from '../CameraStack/CameraStack';
import { PointLightNode } from '../Lights/PointLightNode';
import { WormTunnel } from './WormTunnel/WormTunnel';

export class WormTunnelScene extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    const scene = this;

    const lightRim = new PointLightNode( {
      scene,
      shadowMapFov: 10.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightRim.transform.lookAt( [ 0.0, 0.0, -10.0 ] );
    lightRim.color = [ 100.0, 100.0, 100.0 ];

    const lightFront = new PointLightNode( {
      scene,
      shadowMapFov: 10.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
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
        emit( EventType.CameraFov, 40.0 );
        emit( EventType.CameraDoF, [ 4.0, 5.0 ] );
        emit( EventType.CameraFog, [ 20.0, 5.0, 20.0 ] );

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
