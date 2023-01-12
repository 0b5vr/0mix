import { CameraStack } from '../CameraStack/CameraStack';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { SevenSeg } from './SevenSeg';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { quatRotationY, vec3ApplyQuaternion } from '@0b5vr/experimental';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class SevenSegScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 30.0,
    } );
    light1.transform.lookAt( [ 6.0, 0.0, 3.0 ] );
    light1.color = [ 400.0, 400.0, 400.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 30.0,
    } );
    light2.transform.lookAt( [ -6.0, 0.0, -3.0 ] );
    light2.color = [ 400.0, 400.0, 400.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
    }

    // -- seven seg --------------------------------------------------------------------------------
    const sevenSeg = new SevenSeg();

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 5.0, 8.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 5.0 ],
    );

    // -- speen ------------------------------------------------------------------------------------
    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        camera.transform.lookAt(
          vec3ApplyQuaternion( [ 0.0, 0.0, 5.0 ], quatRotationY( 0.2 * time ) ),
        );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      sevenSeg,
      lambdaSpeen,
      camera,
    ];
  }
}
