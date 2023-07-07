import { CameraStack } from '../CameraStack/CameraStack';
import { CanvasTexture } from '../utils/CanvasTexture';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { GL_ONE, GL_SRC_ALPHA, GL_TEXTURE_2D } from '../../gl/constants';
import { MUSIC_BPM } from '../../music/constants';
import { Material } from '../../heck/Material';
import { PlaneBackground } from '../utils/PlaneBackground';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { TAU } from '../../utils/constants';
import { abs, add, defUniformNamed, mad, mul, sin, smoothstep, step, sw, vec3, vec4 } from '../../shaders/shaderBuilder';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { capsuleFrag } from './shaders/capsuleFrag';
import { capsuleTransFrag } from './shaders/capsuleTransFrag';
import { createCubemapUniformsLambda } from '../utils/createCubemapUniformsLambda';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from '../utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { glslSaturate } from '../../shaders/modules/glslSaturate';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { phongSpecular } from '../../shaders/modules/phongSpecular';

export class CapsuleScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- label ------------------------------------------------------------------------------------
    const texture = new CanvasTexture( 1024, 1024 );

    texture.context.font = '500 128px Arial';
    texture.context.textAlign = 'center';
    texture.context.translate( 512, 480 );
    texture.context.scale( 0.8, 1.0 );
    texture.context.fillText( 'GLSL', 0, 0 );
    texture.context.translate( 0, 128 );
    texture.context.scale( 0.75, 0.75 );
    texture.context.fillText( '300 es', 0, 0 );

    texture.updateTexture();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 10.0, 1.0, 1.0 ] } );

    // -- raymarcher -------------------------------------------------------------------------------
    const raymarcher = new RaymarcherNode( capsuleFrag, {
      geometry,
      tags: [ cubemapExclusionTag ],
    } );

    raymarcher.materials.deferred.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/capsuleFrag',
        ( { capsuleFrag } ) => {
          const { deferred, depth } = raymarcher.materials;

          deferred.replaceShader( objectVert, capsuleFrag( 'deferred' ) );
          depth.replaceShader( objectVert, capsuleFrag( 'depth' ) );
        },
      );
    }

    // -- raymarcher trans -------------------------------------------------------------------------
    const forward = new Material(
      objectVert,
      capsuleTransFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_SRC_ALPHA, GL_ONE ],
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/capsuleTransFrag',
        ( { capsuleTransFrag } ) => {
          forward.replaceShader( objectVert, capsuleTransFrag );
        },
      );
    }

    raymarcher.mesh.materials.forward = forward;

    // -- background -------------------------------------------------------------------------------
    const background = new PlaneBackground( () => {
      const time = defUniformNamed( 'float', 'time' );

      return ( _ro, rd ) => {
        return vec4(
          vec3( add(
            mul( 0.04, smoothstep( 0.2, -0.2, sw( rd, 'y' ) ) ), // bg
            mul(
              glslSaturate( mad( 0.6, sw( rd, 'z' ), 0.4 ) ),
              step( 0.5, sin( mad( TAU * MUSIC_BPM / 60.0, time, sw( rd, 'y' ) ) ) ),
            ), // panel
            mul( 100.0, phongSpecular( abs( rd ), vec3( 1.0, 2.0, 1.0 ), 500.0 ) ), // speculars
          ) ),
          1.0,
        );
      };
    } );

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
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 3.5 ],
      [ 0.0, 0.0, 0.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    raymarcher.children.unshift(
      createRaymarchCameraUniformsLambda( [ forward ] ),
      createLightUniformsLambda( [ forward ] ),
      createCubemapUniformsLambda( cubemapNode, [ forward ] ),
    );

    this.children = [
      raymarcher,
      background,
      cubemapNode,
      camera,
    ];
  }
}
