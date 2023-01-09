import { CameraStack } from '../CameraStack/CameraStack';
import { Lambda } from '../../heck/components/Lambda';
import { LightShaft } from '../Lights/LightShaft';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genOctahedron } from '../../geometries/genOctahedron';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { moonFrag } from './shaders/moonFrag';
import { objectVert } from '../../shaders/common/objectVert';
import { quatRotationY } from '@0b5vr/experimental';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class MoonScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- light ------------------------------------------------------------------------------------
    const lightsRoot = new SceneNode();

    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 20.0,
    } );
    light1.transform.lookAt( [ 5.0, 5.0, 0.0 ] );
    light1.color = [ 500.0, 500.0, 500.0 ];
    lightsRoot.children.push( light1 );

    const shaft1 = new LightShaft( {
      light: light1,
      intensity: 0.1,
    } );
    light1.children.push( shaft1 );

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
    }

    // :: speen ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        lightsRoot.transform.rotation = quatRotationY( 4.0 * time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 2 );

    // -- raymarcher -------------------------------------------------------------------------------
    const raymarcher = new RaymarcherNode( moonFrag, { geometry } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/moonFrag',
        ( { moonFrag } ) => {
          const { deferred, depth } = raymarcher.materials;

          deferred.replaceShader( objectVert, moonFrag( 'deferred' ) );
          depth.replaceShader( objectVert, moonFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 3.2 ],
      [ 0.0, 0.0, 0.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lightsRoot,
      lambdaSpeen,
      raymarcher,
      camera,
    ];
  }
}
