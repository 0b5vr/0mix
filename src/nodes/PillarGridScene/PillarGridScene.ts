import { CameraStack } from '../CameraStack/CameraStack';
import { EventType, emit } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { PillarGrid } from './PillarGrid/PillarGrid';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { quatRotationZ } from '@0b5vr/experimental';

export class PillarGridScene extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    const scene = this;

    const lightT = new PointLightNode( {
      scene,
      shadowMapFov: 40.0,
    } );
    lightT.transform.lookAt( [ 5.0, -3.0, 2.0 ], [ 0.0, 0.0, 1.0 ] );
    lightT.color = [ 500.0, 500.0, 500.0 ];

    const lightB = new PointLightNode( {
      scene,
      shadowMapFov: 40.0,
    } );
    lightB.transform.lookAt( [ 0.0, 3.5, 4.0 ], [ 0.0, 0.0, 1.0 ] );
    lightB.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      lightT.name = 'lightT';
      lightB.name = 'lightB';
    }

    const pillarGrid = new PillarGrid();

    const lambdaSpeen = new Lambda( {
      onUpdate( { time } ) {
        pillarGrid.transform.rotation = quatRotationZ( 0.1 * time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'lambdaSpeen';
    }

    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, -2.0, 3.0 ],
      [ 0.0, 1.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      -0.2,
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.Camera, {
          dof: [ 2.8, 8.0 ],
          fog: [ 0.0, 3.0, 5.0 ],
        } );
        emit( EventType.CubeMap );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    this.children = [
      lightT,
      lightB,
      lambdaSpeen,
      pillarGrid,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
