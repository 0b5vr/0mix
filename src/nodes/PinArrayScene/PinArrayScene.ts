import { CameraStack } from '../CameraStack/CameraStack';
import { Lambda } from '../../heck/components/Lambda';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { pinArrayFrag } from './shaders/pinArrayFrag';
import { quad3DGeometry } from '../../globals/quad3DGeometry';
import { quatRotationZ } from '@0b5vr/experimental';

export class PinArrayScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- metalCube ---------------------------------------------------------------------------------
    const pinArray = new RaymarcherNode( pinArrayFrag, {
      geometry: quad3DGeometry,
      tags: [ cubemapExclusionTag ],
    } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/pinArrayFrag',
        ( { pinArrayFrag } ) => {
          const { deferred, depth } = pinArray.materials;

          deferred.replaceShader( objectVert, pinArrayFrag( 'deferred' ) );
          depth.replaceShader( objectVert, pinArrayFrag( 'depth' ) );
        },
      );
    }

    // -- speen ------------------------------------------------------------------------------------
    const lambdaSpeen = new Lambda( {
      onUpdate( { time } ) {
        pinArray.transform.rotation = quatRotationZ( 0.1 * time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'lambdaSpeen';
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 3.0, 8.0 ],
      denoiserParams: [ 0.1, 0.05, 0.1 ],
    } );
    camera.transform.lookAt(
      [ 0.0, -0.5, 0.8 ],
      [ 0.0, 0.0, 0.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lambdaSpeen,
      pinArray,
      camera,
    ];
  }
}
