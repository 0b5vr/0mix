import { GL_NONE, GL_ONE, GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../CameraStack/deferredConstants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PointLightNode } from './PointLightNode';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { deferredColorFrag } from '../../shaders/common/deferredColorFrag';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genCylinder } from '../../geometries/genCylinder';
import { lightShaftFrag } from './shaders/lightShaftFrag';
import { lightShaftVert } from './shaders/lightShaftVert';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { objectVert } from '../../shaders/common/objectVert';
import { randomTexture } from '../../globals/randomTexture';

export const LightShaftTag = Symbol();

interface LightShaftOptions extends SceneNodeOptions {
  light: PointLightNode;
  intensity?: number;
}

export class LightShaft extends SceneNode {
  private __forward: Material;

  public constructor( options: LightShaftOptions ) {
    super( options );

    this.tags.push( LightShaftTag );

    const { light, intensity } = options;

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCylinder( {
      radialSegs: 64,
    } );

    // -- materials --------------------------------------------------------------------------------
    const forward = this.__forward = new Material(
      lightShaftVert,
      lightShaftFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    forward.addUniform( 'intensity', '1f', intensity ?? 0.01 );

    forward.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );
    forward.addUniformTextures( 'samplerShadow', GL_TEXTURE_2D, light.shadowMap.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/lightShaftVert',
          './shaders/lightShaftFrag',
        ],
        ( [ { lightShaftVert }, { lightShaftFrag } ] ) => {
          forward.replaceShader( lightShaftVert, lightShaftFrag );
        },
      );
    }

    const materials = { forward, cubemap: forward };

    // -- updater ----------------------------------------------------------------------------------
    const lambdaUniforms = new Lambda( {
      onDraw: ( event ) => {
        forward.addUniform( 'lightFov', '1f', light.shadowMapFov );
        forward.addUniform( 'lightNearFar', '2f', light.shadowMapNear, light.shadowMapFar );
        forward.addUniform( 'lightPos', '3f', ...light.globalTransformCache.position );
        forward.addUniform( 'lightColor', '3f', ...light.color );
        forward.addUniform( 'lightParams', '4f', light.spotness, light.spotSharpness, 0.0, 0.0 );

        forward.addUniformMatrixVector(
          'lightPV',
          'Matrix4fv',
          mat4Multiply(
            light.camera.projectionMatrix,
            mat4Inverse( light.globalTransformCache.matrix ),
          ),
        );

        forward.addUniform(
          'cameraNearFar',
          '2f',
          event.camera.near,
          event.camera.far
        );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUniforms.name = 'lambdaUniforms';
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
    } );
    mesh.cull = GL_NONE;
    mesh.depthTest = false;
    mesh.depthWrite = false;

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- """light body""" -------------------------------------------------------------------------
    const nodeBody = new SceneNode();
    nodeBody.transform.scale = [ 0.2, 0.2, 0.2 ];

    if ( import.meta.env.DEV ) {
      nodeBody.name = 'nodeBody';
    }

    const materialBody = new Material(
      objectVert,
      deferredColorFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget4 },
      },
    );
    materialBody.addUniform( 'color', '4f', 0.04, 0.04, 0.04, 1.0 );
    materialBody.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    materialBody.addUniform( 'mtlParams', '4f', 0.7, 1.0, 0.0, 0.0 );

    const meshBody = new Mesh( {
      geometry,
      materials: { deferred: materialBody },
    } );
    meshBody.cull = GL_NONE;
    nodeBody.children = [ meshBody ];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaUniforms,
      mesh,
      nodeBody,
    ];
  }

  /**
   * どうやってフレームバッファのデプスを取るかわかりませんでした 許してほしい
   *
   * `deferredCameraTarget.textures[ 1 ]`
   */
  public setDefferedCameraTexture( texture: WebGLTexture ): void {
    this.__forward.addUniformTextures( 'samplerDeferred1', GL_TEXTURE_2D, texture );
  }
}
