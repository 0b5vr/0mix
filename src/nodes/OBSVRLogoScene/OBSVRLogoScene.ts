import { CameraStack } from '../CameraStack/CameraStack';
import { Dust } from '../Dust/Dust';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { RawVector3, quatFromAxisAngle } from '@0b5vr/experimental';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genCube } from '../../geometries/genCube';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { obsvrLogoFrag } from './shaders/obsvrLogoFrag';
import { swapShadowMap1, swapShadowMap2, swapShadowMap3 } from '../../globals/swapShadowMap';

export class OBSVRLogoScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light1.transform.lookAt( [ 2.0, 1.0, 7.0 ] );
    light1.color = [ 1000.0, 1000.0, 1000.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    light2.transform.lookAt( [ 0.0, -2.0, -5.0 ] );
    light2.color = [ 600.0, 700.0, 800.0 ];

    const light3 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap3,
      shadowMapFov: 40.0,
    } );
    light3.transform.lookAt( [ -5.0, 0.0, -1.0 ] );
    light3.color = [ 600.0, 500.0, 400.0 ];

    // -- dust -------------------------------------------------------------------------------------
    const dust = new Dust( [ 0.02, 0.02, 0.02, 1.0 ] );
    dust.transform.scale = [ 4.0, 4.0, 4.0 ];
    dust.transform.position = [ 0.0, 0.0, 4.0 ];

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 1.1, 1.1, 0.3 ] } );

    // -- raymarcher -------------------------------------------------------------------------------
    const raymarcher = new RaymarcherNode( obsvrLogoFrag, { geometry } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/obsvrLogoFrag',
        ( { obsvrLogoFrag } ) => {
          const { deferred, depth } = raymarcher.materials;

          deferred.replaceShader( objectVert, obsvrLogoFrag( 'deferred' ) );
          depth.replaceShader( objectVert, obsvrLogoFrag( 'depth' ) );
        },
      );
    }

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = [ 0.0, -1.0, 0.0 ] as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        raymarcher.transform.rotation = quatFromAxisAngle( speenAxis, time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 3.8, 8.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 4.0 ],
      [ 0.0, 0.0, 0.0 ],
      0.0,
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      light3,
      lambdaSpeen,
      dust,
      raymarcher,
      camera,
    ];
  }
}
