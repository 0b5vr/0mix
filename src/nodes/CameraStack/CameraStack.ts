import { AO_RESOLUTION_RATIO, FAR, NEAR } from '../../config';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Component, ComponentOptions } from '../../heck/components/Component';
import { DoF } from './DoF/DoF';
import { EventType, on } from '../../globals/globalEvent';
import { GLTextureFormatStuffR16F, GLTextureFormatStuffRGBA16F } from '../../gl/glSetTexture';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { LightShaft, LightShaftTag } from '../Lights/LightShaft';
import { Material } from '../../heck/Material';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { deferredShadeFrag } from './shaders/deferredShadeFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture } from '../../globals/randomTexture';
import { ssaoFrag } from './shaders/ssaoFrag';
import { zeroTexture } from '../../globals/zeroTexture';

export interface CameraStackOptions extends ComponentOptions {
  scene: SceneNode;
  target: RenderTarget;
  exclusionTags?: symbol[];
  near?: number;
  far?: number;
  fov?: number;
  withAO?: boolean;
  withDoF?: boolean;
}

export class CameraStack extends SceneNode {
  public deferredCamera: PerspectiveCamera;
  public forwardCamera: PerspectiveCamera;

  public constructor( options: CameraStackOptions ) {
    super( options );

    this.visible = false;

    const near = options.near ?? NEAR;
    const far = options.far ?? FAR;
    const withDoF = options.withDoF ?? false;
    const withAO = options.withAO ?? false;

    const { target, scene, exclusionTags, fov } = options;
    const cameraTarget = withDoF ? new BufferTextureRenderTarget(
      target.width,
      target.height,
      1,
      GLTextureFormatStuffRGBA16F,
    ) : target;

    // -- deferred g rendering ---------------------------------------------------------------------
    const deferredTarget = new BufferTextureRenderTarget(
      target.width,
      target.height,
      4,
    );

    deferredTarget.textures.map( ( texture ) => (
      glTextureFilter( texture, GL_NEAREST )
    ) );

    const deferredCamera = this.deferredCamera = new PerspectiveCamera( {
      scene,
      exclusionTags,
      renderTarget: deferredTarget,
      near,
      far,
      fov,
      materialTag: 'deferred',
    } );

    // -- ambient occlusion ------------------------------------------------------------------------
    let aoComponents: Component[] = [];
    let aoTarget: BufferTextureRenderTarget | undefined;

    if ( withAO ) {
      aoTarget = new BufferTextureRenderTarget(
        AO_RESOLUTION_RATIO * target.width,
        AO_RESOLUTION_RATIO * target.height,
        1,
        GLTextureFormatStuffR16F,
      );

      const aoMaterial = new Material(
        quadVert,
        ssaoFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
      );

      if ( import.meta.hot ) {
        import.meta.hot.accept( './shaders/ssaoFrag', ( { ssaoFrag } ) => {
          aoMaterial.replaceShader( quadVert, ssaoFrag );
        } );
      }

      const lambdaAoSetCameraUniforms = new Lambda( {
        onUpdate: ( { globalTransform } ) => {
          const cameraView = mat4Inverse( globalTransform.matrix );

          aoMaterial.addUniformMatrixVector(
            'cameraPV',
            'Matrix4fv',
            mat4Multiply( deferredCamera.projectionMatrix, cameraView ),
          );
        },
      } );

      if ( import.meta.env.DEV ) {
        lambdaAoSetCameraUniforms.name = 'aoSetCameraUniforms';
      }

      for ( let i = 1; i < 3; i ++ ) { // it doesn't need 0 and 3
        aoMaterial.addUniformTextures(
          'sampler' + i,
          GL_TEXTURE_2D,
          deferredTarget.textures[ i ],
        );
      }

      aoMaterial.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

      const aoQuad = new Quad( {
        material: aoMaterial,
        target: aoTarget,
      } );

      if ( import.meta.env.DEV ) {
        aoQuad.name = 'aoQuad';
      }

      aoComponents = [
        lambdaAoSetCameraUniforms,
        aoQuad,
      ];
    }

    // -- deferred ---------------------------------------------------------------------------------
    const shadingMaterial = new Material(
      quadVert,
      deferredShadeFrag( { withAO } ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/deferredShadeFrag', ( { deferredShadeFrag } ) => {
        shadingMaterial.replaceShader( quadVert, deferredShadeFrag( { withAO } ) );
      } );
    }

    const lambdaDeferredCameraUniforms = new Lambda( {
      onUpdate: ( { globalTransform } ) => {
        const cameraView = mat4Inverse( this.transform.matrix );

        shadingMaterial.addUniformMatrixVector(
          'cameraView',
          'Matrix4fv',
          cameraView
        );

        shadingMaterial.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          mat4Multiply( deferredCamera.projectionMatrix, cameraView ),
        );

        shadingMaterial.addUniform(
          'cameraNearFar',
          '2f',
          deferredCamera.near,
          deferredCamera.far
        );

        shadingMaterial.addUniform(
          'cameraPos',
          '3f',
          ...globalTransform.position,
        );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaDeferredCameraUniforms.name = 'lambdaDeferredCameraUniforms';
    }

    const lambdaLightUniforms = createLightUniformsLambda( [ shadingMaterial ] );

    for ( let i = 0; i < 4; i ++ ) {
      shadingMaterial.addUniformTextures(
        'sampler' + i,
        GL_TEXTURE_2D,
        deferredTarget.textures[ i ],
      );
    }

    aoTarget && shadingMaterial.addUniformTextures(
      'samplerAo',
      GL_TEXTURE_2D,
      aoTarget.texture,
    );

    // shadingMaterial.addUniformTextures( 'samplerEnv', textureEnv );
    shadingMaterial.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: cameraTarget,
      clear: [],
    } );

    if ( import.meta.env.DEV ) {
      shadingQuad.name = 'shadingQuad';
    }

    // -- forward ----------------------------------------------------------------------------------
    const lambdaUpdateLightShaftDeferredRenderTarget = new Lambda( {
      onUpdate: ( { componentsByTag } ) => {
        Array.from( componentsByTag.get( LightShaftTag ) ).map( ( lightShaft ) => {
          ( lightShaft as LightShaft ).setDefferedCameraTexture( deferredTarget.textures[ 1 ] );
        } );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateLightShaftDeferredRenderTarget.name = 'lambdaUpdateLightShaftDeferredRenderTarget';
    }

    const forwardCamera = this.forwardCamera = new PerspectiveCamera( {
      scene,
      exclusionTags,
      renderTarget: cameraTarget,
      near,
      far,
      fov,
      clear: false,
      materialTag: 'forward',
    } );

    if ( import.meta.env.DEV ) {
      forwardCamera.name = 'forwardCamera';
    }

    // -- dof --------------------------------------------------------------------------------------
    let dof: DoF | undefined;

    if ( withDoF ) {
      dof = new DoF( {
        input: cameraTarget as BufferTextureRenderTarget,
        deferredCamera,
        deferredTarget,
        target,
      } );
    }

    // -- event listeners --------------------------------------------------------------------------
    on( EventType.Camera, ( o ) => {
      const fov = o?.fov ?? 40.0;
      this.deferredCamera.fov = fov;
      this.forwardCamera.fov = fov;

      const fog = o?.fog ?? [ 0.0, 100.0, 100.0 ];
      shadingMaterial.addUniform( 'fog', '3f', ...fog );
    } );

    on( EventType.IBLLUT, ( ibllutTexture ) => {
      shadingMaterial.addUniformTextures(
        'samplerIBLLUT',
        GL_TEXTURE_2D,
        ibllutTexture,
      );
    } );

    on( EventType.CubeMap, ( cubemapNode ) => {
      shadingMaterial.addUniformTextures(
        'samplerEnvDry',
        GL_TEXTURE_2D,
        cubemapNode?.targetDry?.texture ?? zeroTexture,
      );
      shadingMaterial.addUniformTextures(
        'samplerEnvWet',
        GL_TEXTURE_2D,
        cubemapNode?.targetWet?.texture ?? zeroTexture,
      );
    } );

    // -- buffer names -----------------------------------------------------------------------------
    if ( import.meta.env.DEV ) {
      const id = Math.floor( 1E9 * Math.random() );

      deferredTarget.name = `CameraStack${ id }/deferredTarget`;

      if ( aoTarget != null ) {
        aoTarget.name = `CameraStack${ id }/aoTarget`;
      }
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      deferredCamera,
      ...aoComponents,
      lambdaDeferredCameraUniforms,
      lambdaLightUniforms,
      shadingQuad,
      lambdaUpdateLightShaftDeferredRenderTarget,
      forwardCamera,
      ...( dof ? [ dof ] : [] ),
    ];
  }

  public setScene( scene: SceneNode ): void {
    this.deferredCamera.scene = scene;
    this.forwardCamera.scene = scene;
  }
}
