import { CameraStack } from '../CameraStack/CameraStack';
import { Dust } from '../Dust/Dust';
import { GL_NONE } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { PointLightNode } from '../Lights/PointLightNode';
import { RawVector3, quatFromAxisAngle, vec3ApplyQuaternion } from '@0b5vr/experimental';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genCube } from '../../geometries/genCube';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { swapShadowMap1, swapShadowMap2, swapShadowMap3 } from '../../globals/swapShadowMap';
import { truchetFrag } from './shaders/truchetFrag';

export class TruchetScene extends SceneNode {
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
    const dust = new Dust( [ 0.5, 0.5, 0.5, 1.0 ] );
    dust.transform.scale = [ 5.0, 5.0, 5.0 ];
    dust.transform.position = [ 0.0, 0.0, 0.0 ];

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 5.0, 5.0, 5.0 ] } );

    const raymarcher = new RaymarcherNode( truchetFrag, { geometry } );
    raymarcher.mesh.cull = GL_NONE;

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/truchetFrag',
        ( { truchetFrag } ) => {
          const { deferred, depth } = raymarcher.materials;

          deferred.replaceShader( objectVert, truchetFrag( 'deferred' ) );
          depth.replaceShader( objectVert, truchetFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 1.5, 16.0 ],
      fog: [ 0.0, 5.0, 10.0 ],
    } );

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = [ 0.0, -1.0, 0.0 ] as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        camera.transform.lookAt(
          vec3ApplyQuaternion( [ 0.0, 0.0, 4.0 ], quatFromAxisAngle( speenAxis, 0.4 * time ) ),
          vec3ApplyQuaternion( [ 4.0, 2.0, 0.0 ], quatFromAxisAngle( speenAxis, 0.4 * time ) ),
          0.1 * time,
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
      light3,
      dust,
      raymarcher,
      lambdaSpeen,
      camera,
    ];
  }
}
