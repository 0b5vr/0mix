import { CameraStack } from '../CameraStack/CameraStack';
import { EventType, emit } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { Trails } from './Trails/Trails';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class TrailsScene extends SceneNode {
  public cameraProxy: SceneNode;

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

    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, 0.0, 2.0 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      -0.4
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.Camera, {
          dof: [ 1.0, 4.0 ],
          fog: [ 0.0, 20.0, 20.0 ],
        } );
        emit( EventType.CubeMap );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    this.children = [
      light1,
      trails,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
