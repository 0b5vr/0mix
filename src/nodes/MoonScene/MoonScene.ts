import { CameraStack } from '../CameraStack/CameraStack';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { InstancedLines } from '../utils/InstancedLines';
import { Lambda } from '../../heck/components/Lambda';
import { LightShaft } from '../Lights/LightShaft';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genOctahedron } from '../../geometries/genOctahedron';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { mebiusVert } from './shaders/mebiusVert';
import { moonFrag } from './shaders/moonFrag';
import { moonTexture } from '../../globals/moonTexGen';
import { objectVert } from '../../shaders/common/objectVert';
import { quatRotationY } from '@0b5vr/experimental';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class MoonScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- light ------------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 20.0,
    } );
    light1.transform.lookAt( [ 5.0, 5.0, 2.0 ] );
    light1.color = [ 500.0, 500.0, 500.0 ];

    const shaft1 = new LightShaft( {
      light: light1,
      intensity: 0.1,
    } );
    light1.children.push( shaft1 );

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
    } );
    light2.transform.lookAt( [ 0.0, -5.0, 5.0 ] );
    light2.color = [ 10.0, 10.0, 10.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
    }

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 2 );

    // -- raymarcher -------------------------------------------------------------------------------
    const raymarcher = new RaymarcherNode( moonFrag, { geometry } );

    raymarcher.materials.deferred.addUniformTextures( 'sampler0', GL_TEXTURE_2D, moonTexture );
    raymarcher.materials.depth.addUniformTextures( 'sampler0', GL_TEXTURE_2D, moonTexture );

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

    // -- mebius -----------------------------------------------------------------------------------
    const mebius = new InstancedLines( mebiusVert, 257, 13 );
    mebius.deferred.addUniform( 'strength', '1f', 1.0 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/mebiusVert',
        ( { mebiusVert } ) => {
          mebius.materials.deferred!.replaceShader( mebiusVert );
        }
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 3.0, 8.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 3.5 ],
      [ 0.0, 0.0, 0.0 ],
    );

    // :: speen ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        raymarcher.transform.rotation = quatRotationY( 0.2 * time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      lambdaSpeen,
      mebius,
      raymarcher,
      camera,
    ];
  }
}
