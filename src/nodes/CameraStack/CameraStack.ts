import { CameraStackResources, createCameraStackResources } from './CameraStackResources';
import { ComponentOptions } from '../../heck/components/Component';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { Denoiser } from './Denoiser/Denoiser';
import { DoF } from './DoF/DoF';
import { EventType, on } from '../../globals/globalEvent';
import { FAR, NEAR } from '../../config';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { LightShaft, LightShaftTag } from '../Lights/LightShaft';
import { Material } from '../../heck/Material';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';
import { Quad } from '../../heck/components/Quad';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { deferredShadeFrag } from './shaders/deferredShadeFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
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
  fog?: [ brightness: number, near: number, far: number ];
  dofParams?: [
    depth: number,
    size: number,
  ];
  clear?: number[] | false;
  useAO?: boolean;
  useDenoiser?: boolean;
  cubemapNode?: CubemapNode;
  resources?: CameraStackResources;
}

export class CameraStack extends SceneNode {
  public deferredCamera: PerspectiveCamera;
  public forwardCamera: PerspectiveCamera;
  public resources: CameraStackResources;
  public dof?: DoF;

  public constructor( options: CameraStackOptions ) {
    super( options );

    this.visible = false;

    const near = options.near ?? NEAR;
    const far = options.far ?? FAR;
    const fov = options.fov ?? 40.0;
    const fog = options.fog ?? [ 0.0, 100.0, 100.0 ];

    const {
      target,
      scene,
      exclusionTags,
      resources,
      dofParams,
      clear,
      useAO,
      useDenoiser,
      cubemapNode,
    } = options;

    // -- resources --------------------------------------------------------------------------------
    const [
      deferredTarget,
      aoTarget,
      aoDenoiserSwap,
      shadeTarget,
      denoiserSwap,
      dofResources,
    ] = this.resources = resources ?? createCameraStackResources();

    // -- deferred g rendering ---------------------------------------------------------------------
    const deferredCamera = this.deferredCamera = new PerspectiveCamera( {
      scene,
      exclusionTags,
      target: deferredTarget,
      near,
      far,
      fov,
      materialTag: 'deferred',
    } );
    this.children = [ deferredCamera ];

    // -- ambient occlusion ------------------------------------------------------------------------
    if ( useAO && aoTarget ) {
      // :: material :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
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

      // :: lambda :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
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

      // :: quad :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const aoQuad = new Quad( {
        material: aoMaterial,
        target: aoTarget,
      } );

      if ( import.meta.env.DEV ) {
        aoQuad.name = 'aoQuad';
      }

      // :: denoiser :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const denoiser = new Denoiser( {
        deferredTarget,
        shadeTarget: aoTarget,
        swap: aoDenoiserSwap!,
        iter: 3,
      } );

      if ( import.meta.env.DEV ) {
        denoiser.name = 'aoDenoiser';
      }

      // :: children :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      this.children.push(
        lambdaAoSetCameraUniforms,
        aoQuad,
        denoiser,
      );
    }

    // -- deferred ---------------------------------------------------------------------------------
    const shadingMaterial = new Material(
      quadVert,
      deferredShadeFrag( { withAO: !!( aoTarget && useAO ) } ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/deferredShadeFrag', ( { deferredShadeFrag } ) => {
        shadingMaterial.replaceShader(
          quadVert,
          deferredShadeFrag( { withAO: !!( aoTarget && useAO ) } )
        );
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
    this.children.push( lambdaDeferredCameraUniforms );

    if ( import.meta.env.DEV ) {
      lambdaDeferredCameraUniforms.name = 'lambdaDeferredCameraUniforms';
    }

    this.children.push( createLightUniformsLambda( [ shadingMaterial ] ) );

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

    // shadingMaterial.addUniformTextures( 'samplerEnv', textureEnv );
    shadingMaterial.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    shadingMaterial.addUniform( 'fog', '3f', ...fog );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: dofParams ? shadeTarget : target,
      clear: clear ?? [],
    } );
    this.children.push( shadingQuad );

    if ( import.meta.env.DEV ) {
      shadingQuad.name = 'shadingQuad';
    }

    // -- denoiser ---------------------------------------------------------------------------------
    if ( useDenoiser && denoiserSwap ) {
      this.children.push( new Denoiser( {
        swap: denoiserSwap!,
        deferredTarget,
        shadeTarget: shadeTarget!,
        iter: 5,
      } ) );
    }

    // -- forward ----------------------------------------------------------------------------------
    const lambdaUpdateLightShaftDeferredRenderTarget = new Lambda( {
      onUpdate: ( { componentsByTag } ) => {
        Array.from( componentsByTag.get( LightShaftTag ) ).map( ( lightShaft ) => {
          ( lightShaft as LightShaft ).setDefferedCameraTexture( deferredTarget.textures[ 1 ] );
        } );
      },
    } );
    this.children.push( lambdaUpdateLightShaftDeferredRenderTarget );

    if ( import.meta.env.DEV ) {
      lambdaUpdateLightShaftDeferredRenderTarget.name = 'lambdaUpdateLightShaftDeferredRenderTarget';
    }

    this.forwardCamera = new PerspectiveCamera( {
      scene,
      exclusionTags,
      target: dofParams ? shadeTarget : target,
      near,
      far,
      fov,
      clear: false,
      materialTag: 'forward',
    } );
    this.children.push( this.forwardCamera );

    if ( import.meta.env.DEV ) {
      this.forwardCamera.name = 'forwardCamera';
    }

    // -- dof --------------------------------------------------------------------------------------
    if ( dofParams ) {
      this.dof = new DoF( {
        input: shadeTarget!,
        deferredCamera,
        deferredTarget,
        resources: dofResources!,
        params: dofParams,
        target,
      } );
      this.children.push( this.dof );
    }

    // -- auto -------------------------------------------------------------------------------------
    auto( 'Deferred/aoMix', ( { value } ) => {
      shadingMaterial.addUniform( 'aoMix', '1f', value );
    } );

    auto( 'Deferred/aoInvert', ( { value } ) => {
      shadingMaterial.addUniform( 'aoInvert', '1f', value );
    } );

    // -- event listeners --------------------------------------------------------------------------
    on( EventType.IBLLUT, ( ibllutTexture ) => {
      shadingMaterial.addUniformTextures(
        'samplerIBLLUT',
        GL_TEXTURE_2D,
        ibllutTexture,
      );
    } );

    // -- buffer names -----------------------------------------------------------------------------
    if ( import.meta.env.DEV ) {
      const id = Math.floor( 1E9 * Math.random() );

      deferredTarget.name = `CameraStack${ id }/deferredTarget`;
    }
  }
}
