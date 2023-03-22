import { CameraStack } from '../CameraStack/CameraStack';
import { HALF_SQRT_TWO } from '../../utils/constants';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { inkFrag } from './shaders/inkFrag';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { quad3DGeometry } from '../../globals/quad3DGeometry';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class InkScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light1.transform.lookAt( [ 0.0, 2.0, 5.0 ] );
    light1.color = [ 10.0, 10.0, 10.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    light2.transform.lookAt( [ 0.0, 2.0, -5.0 ] );
    light2.color = [ 100.0, 100.0, 100.0 ];

    // -- ink plane --------------------------------------------------------------------------------
    const inkPlane = new RaymarcherNode(
      inkFrag,
      {
        geometry: quad3DGeometry,
      }
    );
    inkPlane.transform.rotation = [ -HALF_SQRT_TWO, 0.0, 0.0, HALF_SQRT_TWO ];

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/inkFrag',
        ( { inkFrag } ) => {
          inkPlane.materials.deferred.replaceShader( undefined, inkFrag( 'deferred' ) );
          inkPlane.materials.depth.replaceShader( undefined, inkFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 0.2, 16.0 ],
      fog: [ 0.0, 0.2, 0.8 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.1, 0.2 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      inkPlane,
      camera,
    ];
  }
}
