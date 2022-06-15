import { AO_RESOLUTION_RATIO, FAR, NEAR } from '../../config';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { Component, ComponentOptions } from '../../heck/components/Component';
import { Floor } from '../Floor/Floor';
import { FloorCamera } from '../Floor/FloorCamera';
import { Lambda } from '../../heck/components/Lambda';
import { LightShaft, LightShaftTag } from '../Lights/LightShaft';
import { Material } from '../../heck/Material';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';
import { PostStack } from '../PostStack/PostStack';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { createCubemapUniformsLambda } from '../utils/createCubemapUniformsLambda';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { deferredShadeFrag } from './shaders/deferredShadeFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture } from '../../globals/randomTexture';
import { ssaoFrag } from './shaders/ssaoFrag';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../gl/constants';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { glTextureFilter } from '../../gl/glTextureFilter';

export interface CameraStackOptions extends ComponentOptions {
  width: number;
  height: number;
  scene: SceneNode;
  target: RenderTarget;
  exclusionTags?: symbol[];
  floor?: Floor;
  near?: number;
  far?: number;
  fov?: number;
  withPost?: boolean;
  withAO?: boolean;
}

export class CameraStack extends SceneNode {
  public deferredCamera: PerspectiveCamera;
  public forwardCamera: PerspectiveCamera;
  public postStack?: PostStack;

  public get fov(): number {
    return this.deferredCamera.fov;
  }

  public set fov( value: number ) {
    this.deferredCamera.fov = value;
    this.forwardCamera.fov = value;
  }

  public constructor( options: CameraStackOptions ) {
    super( options );

    this.visible = false;

    const near = options.near ?? NEAR;
    const far = options.far ?? FAR;
    const withAO = options.withAO ?? false;

    const { width, height, target, scene, exclusionTags, floor, withPost, fov } = options;

    const cameraTarget = withPost ? new BufferTextureRenderTarget(
      target.width,
      target.height,
    ) : target;

    if ( import.meta.env.DEV && cameraTarget instanceof RawBufferRenderTarget ) {
      cameraTarget.name = `${ this.name }/cameraTarget`;
    }

    // -- deferred g rendering ---------------------------------------------------------------------
    const deferredTarget = new BufferTextureRenderTarget(
      target.width,
      target.height,
      4,
    );

    deferredTarget.textures.map( ( texture ) => (
      glTextureFilter( texture, GL_NEAREST )
    ) );

    if ( import.meta.env.DEV ) {
      deferredTarget.name = `${ this.name }/deferredTarget`;
    }

    const deferredCamera = this.deferredCamera = new PerspectiveCamera( {
      scene,
      exclusionTags,
      renderTarget: deferredTarget,
      near,
      far,
      fov,
      materialTag: 'deferred',
    } );

    if ( import.meta.env.DEV ) {
      deferredCamera.name = 'deferredCamera';
    }

    // -- ambient occlusion ------------------------------------------------------------------------
    let aoComponents: Component[] = [];
    let aoTarget: BufferTextureRenderTarget | undefined;

    if ( withAO ) {
      aoTarget = new BufferTextureRenderTarget(
        AO_RESOLUTION_RATIO * target.width,
        AO_RESOLUTION_RATIO * target.height,
      );

      if ( import.meta.env.DEV ) {
        aoTarget.name = `${ this.name }/aoTarget`;
      }

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

    const lambdaCubemap = createCubemapUniformsLambda( [ shadingMaterial ] );

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

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/deferredShadeFrag', ( { deferredShadeFrag } ) => {
        shadingMaterial.replaceShader( quadVert, deferredShadeFrag( { withAO } ) );
      } );
    }

    // -- forward ----------------------------------------------------------------------------------
    const lambdaUpdateLightShaftDeferredRenderTarget = new Lambda( {
      onUpdate: ( { componentsByTag } ) => {
        Array.from( componentsByTag.get( LightShaftTag ) ).map( ( lightShaft ) => {
          ( lightShaft as LightShaft ).setDefferedCameraTexture( deferredTarget.textures[ 1 ] );
        } );
      },
    } );

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

    // -- floor camera -----------------------------------------------------------------------------
    const floorComponents = floor ? [ new FloorCamera( {
      width,
      height,
      primaryCamera: this,
      floor,
    } ) ] : [];

    // -- post -------------------------------------------------------------------------------------
    if ( withPost ) {
      this.postStack = new PostStack( {
        input: cameraTarget as BufferTextureRenderTarget,
        target,
      } );
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      ...floorComponents,
      deferredCamera,
      ...aoComponents,
      lambdaDeferredCameraUniforms,
      lambdaLightUniforms,
      lambdaCubemap,
      shadingQuad,
      lambdaUpdateLightShaftDeferredRenderTarget,
      forwardCamera,
      ...( this.postStack ? [ this.postStack ] : [] ),
    ];
  }
}
