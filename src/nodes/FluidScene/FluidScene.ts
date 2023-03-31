import { CameraStack } from '../CameraStack/CameraStack';
import { Fluid } from './Fluid';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { fluidFrameFrag } from './shaders/fluidFrameFrag';
import { genWireCube } from '../../geometries/genWireCube';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { quatRotationY, vec3ApplyQuaternion } from '@0b5vr/experimental';
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

    // == frame ====================================================================================
    const geometryFrame = genWireCube( [ 0.5, 0.5, 0.5 ] );

    const forwardFrame = new Material(
      objectVert,
      fluidFrameFrag,
      {
        initOptions: { geometry: geometryFrame, target: dummyRenderTarget1 },
      }
    );

    const frame = new Mesh( {
      geometry: geometryFrame,
      materials: { forward: forwardFrame },
    } );

    if ( import.meta.env.DEV ) {
      frame.name = 'frame';
    }

    // == camera ===================================================================================
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
    } );

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        camera.transform.lookAt(
          vec3ApplyQuaternion( [ 0.0, 0.1, 1.5 ], quatRotationY( 0.2 * time ) ),
        );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    fluid.forward.addUniformTextures(
      'samplerDeferredPos',
      GL_TEXTURE_2D,
      mainCameraStackResources[ 0 ].textures[ 1 ],
    );

    // == children =================================================================================
    this.children = [
      lightF,
      lightR,
      frame,
      fluid,
      lambdaSpeen,
      camera,
    ];
  }
}
