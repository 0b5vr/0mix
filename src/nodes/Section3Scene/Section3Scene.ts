import { CameraStack } from '../CameraStack/CameraStack';
import { CanvasTexture } from '../utils/CanvasTexture';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PlaneBackground } from '../utils/PlaneBackground';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { buildPlaneBackgroundFrag } from '../utils/shaders/buildPlaneBackgroundFrag';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { createPromiseSVGImage } from '../../utils/createPromiseSVGImage';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { footbridgeFrag } from './shaders/footbridgeFrag';
import { genCube } from '../../geometries/genCube';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { perlinFBMTextureTarget } from '../../textures/perlinFBMTextureTarget';
import { quad3DGeometry } from '../../globals/quad3DGeometry';
import { section3Background } from './shaders/section3Background';
import { section3Frag } from './shaders/section3Frag';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';
import section3Svg from './assets/section3.svg?raw';

export class Section3Scene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- canvas -----------------------------------------------------------------------------------
    const texture = new CanvasTexture( 1024, 512 );
    const { context } = texture;

    createPromiseSVGImage( section3Svg ).then( ( image ) => {
      context.drawImage( image, 0, 0 );
      texture.updateTexture();
    } );

    // -- light ------------------------------------------------------------------------------------
    const lightL = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightL.transform.lookAt( [ 3.0, 1.0, 2.0 ], [ 0.0, 0.0, 0.0 ] );
    lightL.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      lightL.name = 'lightL';
    }

    const lightR = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    lightR.transform.lookAt( [ -2.0, 1.0, -1.0 ], [ 0.0, 0.0, 0.0 ] );
    lightR.color = [ 40.0, 40.0, 40.0 ];

    if ( import.meta.env.DEV ) {
      lightR.name = 'lightR';
    }

    // -- section 3 --------------------------------------------------------------------------------
    const deferred = new Material(
      objectVert,
      section3Frag( 'deferred' ),
      {
        initOptions: { geometry: quad3DGeometry, target: dummyRenderTarget4 },
      }
    );

    deferred.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture.texture );
    deferred.addUniformTextures(
      'sampler1',
      GL_TEXTURE_2D,
      perlinFBMTextureTarget.texture,
    );

    const depth = new Material(
      objectVert,
      section3Frag( 'depth' ),
      {
        initOptions: { geometry: quad3DGeometry, target: dummyRenderTarget1 },
      }
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/section3Frag',
        ( { section3Frag } ) => {
          deferred.replaceShader( objectVert, section3Frag( 'deferred' ) );
          depth.replaceShader( objectVert, section3Frag( 'depth' ) );
        },
      );
    }

    const section3 = new Mesh( {
      geometry: quad3DGeometry,
      materials: { deferred, depth },
      tags: [ cubemapExclusionTag ],
    } );

    // -- footbridge -------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 5.0, 1.0, 1.0 ] } );

    const footbridge = new RaymarcherNode( footbridgeFrag, {
      geometry,
      tags: [ cubemapExclusionTag ],
    } );
    footbridge.transform.position = [ 0.0, 0.0, -1.0 ];

    footbridge.materials.deferred.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      perlinFBMTextureTarget.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/footbridgeFrag',
        ( { footbridgeFrag } ) => {
          const { deferred, depth } = footbridge.materials;

          deferred.replaceShader( objectVert, footbridgeFrag( 'deferred' ) );
          depth.replaceShader( objectVert, footbridgeFrag( 'depth' ) );
        },
      );
    }

    // -- background -------------------------------------------------------------------------------
    const background = new PlaneBackground( section3Background );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/section3Background',
        ( { section3Background } ) => {
          background.deferred.replaceShader(
            undefined,
            buildPlaneBackgroundFrag( section3Background ),
          );
        },
      );
    }

    // -- cubemap ----------------------------------------------------------------------------------
    const cubemapNode = new CubemapNode( {
      scene,
      accumMix: 0.3,
      exclusionTags: [ cubemapExclusionTag ],
    } );

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      cubemapNode,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 3.4, 24.0 ],
    } );

    const lambdaShake = new Lambda( {
      onUpdate( { time } ) {
        camera.transform.lookAt(
          [
            -1.0 - 0.03 * Math.sin( 1.2 * time ),
            -2.0,
            2.4 + 0.03 * Math.cos( 1.7 * time ),
          ],
          [ -0.4, -0.2, 0.0 ],
          0.1 + 0.01 * Math.sin( 1.4 * time ),
        );
      },
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lightL,
      lightR,
      section3,
      footbridge,
      background,
      cubemapNode,
      lambdaShake,
      camera,
    ];
  }
}
