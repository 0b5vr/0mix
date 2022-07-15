import { quatFromAxisAngle } from '@0b5vr/experimental';
import { FAR, NEAR } from '../../config';
import { emit, EventType } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';
import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { Dust } from '../Dust/Dust';
import { PointLightNode } from '../Lights/PointLightNode';
import { Sponge } from './Sponge/Sponge';

export class SpongeScene extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    const scene = this;

    const lightL = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightL.transform.lookAt( [ -6.0, 0.0, 0.0 ] );
    lightL.color = [ 10.0, 30.0, 40.0 ];

    const lightR = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightR.transform.lookAt( [ 5.0, 0.0, -2.0 ] );
    lightR.color = [ 50.0, 50.0, 50.0 ];

    const lightF = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightF.transform.lookAt( [ 1.0, 1.0, 7.0 ] );
    lightF.color = [ 10.0, 10.0, 10.0 ];

    if ( import.meta.env.DEV ) {
      lightL.name = 'lightL';
      lightR.name = 'lightR';
      lightF.name = 'lightF';
    }

    const sponge = new Sponge();
    sponge.transform.scale = [ 3.0, 3.0, 3.0 ];

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

    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, 0.2, 3.0 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      0.4,
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.CameraFov, 40.0 );
        emit( EventType.CameraDoF, [ 1.5, 8.0 ] );
        emit( EventType.CameraFog, [ 0.0, 100.0, 100.0 ] );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    this.children = [
      lambdaSpeen,
      lightL,
      lightR,
      lightF,
      sponge,
      dust,
      cubemapNode,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
