import { Blit } from '../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { CameraStack } from '../CameraStack/CameraStack';
import { ComponentOptions } from '../../heck/components/Component';
import { GLTextureFormatStuffR11G11B10F } from '../../gl/glSetTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RawQuaternion, Swap, arraySerial } from '@0b5vr/experimental';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { createCameraStackResources, resizeCameraStackResources } from '../CameraStack/CameraStackResources';
import { cubemapBlurFrag } from './shaders/cubemapBlurFrag';
import { cubemapMergeFrag } from './shaders/cubemapMergeFrag';
import { cubemapSampleFrag } from './shaders/cubemapSampleFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

const INV_SQRT2 = 1.0 / Math.sqrt( 2.0 );

const CUBEMAP_ROTATIONS: RawQuaternion[] = [ // 🔥
  [ 0.0, -INV_SQRT2, 0.0, INV_SQRT2 ], // PX
  [ 0.0, INV_SQRT2, 0.0, INV_SQRT2 ], // NX
  [ 0.0, INV_SQRT2, -INV_SQRT2, 0.0 ], // PY
  [ 0.0, INV_SQRT2, INV_SQRT2, 0.0 ], // NY
  [ 0.0, 1.0, 0.0, 0.0 ], // PZ
  [ 0.0, 0.0, 0.0, 1.0 ], // NZ
];

export interface CubemapNodeOptions extends ComponentOptions {
  scene: SceneNode;
  near?: number;
  exclusionTags?: symbol[];
}

const targets = arraySerial( 6 ).map( () => (
  new BufferTextureRenderTarget( 256, 256, 1, GLTextureFormatStuffR11G11B10F )
) );

const cameraStackResources = targets.map( () => {
  const resources = createCameraStackResources();
  resizeCameraStackResources( resources, 256, 256 );
  return resources;
} );

if ( import.meta.env.DEV ) {
  targets.map( ( target, i ) => target.name = `cubemapTarget${ i }` );
}

export class CubemapNode extends SceneNode {
  public targetDry: BufferTextureRenderTarget;
  public targetWet: BufferTextureRenderTarget;

  public constructor( options: CubemapNodeOptions ) {
    super( options );

    this.visible = false;

    const { scene } = options;

    // -- cameras ----------------------------------------------------------------------------------
    const cameras = targets.map( ( target, i ) => {
      const cameraStack = new CameraStack( {
        scene,
        resources: cameraStackResources[ i ],
        exclusionTags: options?.exclusionTags,
        target,
        near: options.near ?? 1.0,
        fov: 90.0,
      } );

      cameraStack.transform.rotation = CUBEMAP_ROTATIONS[ i ];

      return cameraStack;
    } );

    // -- compiler ---------------------------------------------------------------------------------
    const targetCompiled = this.targetDry = new BufferTextureRenderTarget( 768, 512 );

    const blitsCompile = targets.map( ( src, i ) => {
      const x = 256 * ~~( i / 2 );
      const y = 256 * ( i % 2 );
      return new Blit( {
        src,
        dst: targetCompiled,
        dstRect: [
          x,
          y,
          x + 256,
          y + 256,
        ],
      } );
    } );

    // -- sample ggx -------------------------------------------------------------------------------
    const swapTargetSample = new Swap(
      new BufferTextureRenderTarget( 768, 512 ),
      new BufferTextureRenderTarget( 768, 512 ),
    );

    const materialSample = new Material(
      quadVert,
      cubemapSampleFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    materialSample.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetCompiled.texture,
    );

    auto( 'cubemap/accumMix', ( { value } ) => {
      materialSample.addUniform( 'accumMix', '1f', value );
    } );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/cubemapSampleFrag', ( { cubemapSampleFrag } ) => {
        materialSample.replaceShader( quadVert, cubemapSampleFrag );
      } );
    }

    const quadSample = new Quad( {
      material: materialSample,
    } );

    if ( import.meta.env.DEV ) {
      quadSample.name = 'quadSample';
    }

    // -- merge accumulated ------------------------------------------------------------------------
    const targetMerge = new BufferTextureRenderTarget( 768, 512 );

    const materialMerge = new Material(
      quadVert,
      cubemapMergeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/cubemapMergeFrag', ( { cubemapMergeFrag } ) => {
        materialMerge.replaceShader( quadVert, cubemapMergeFrag );
      } );
    }

    const quadMerge = new Quad( {
      material: materialMerge,
      target: targetMerge,
    } );

    if ( import.meta.env.DEV ) {
      quadMerge.name = 'quadMerge';
    }

    // -- swapper ----------------------------------------------------------------------------------
    const lambdaSwapTargetSample = new Lambda( {
      onUpdate: () => {
        swapTargetSample.swap();

        materialSample.addUniformTextures(
          'samplerPrev',
          GL_TEXTURE_2D,
          swapTargetSample.o.texture,
        );
        quadSample.target = swapTargetSample.i;
        materialMerge.addUniformTextures(
          'samplerCubemap',
          GL_TEXTURE_2D,
          swapTargetSample.o.texture,
        );
      },
    } );

    // -- blur -------------------------------------------------------------------------------------
    const targetBlurH = new BufferTextureRenderTarget( 768, 512 );

    const targetBlurV = this.targetWet = new BufferTextureRenderTarget( 768, 512 );

    if ( import.meta.env.DEV ) {
      targetBlurH.name = 'cubemapBlurH';
      targetBlurV.name = 'cubemapBlurV';
    }

    const materialBlurH = new Material(
      quadVert,
      cubemapBlurFrag( 0 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    materialBlurH.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetMerge.texture,
    );

    const materialBlurV = new Material(
      quadVert,
      cubemapBlurFrag( 1 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    materialBlurV.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetBlurH.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/cubemapBlurFrag', ( { cubemapBlurFrag } ) => {
        materialBlurH.replaceShader( quadVert, cubemapBlurFrag( 0 ) );
        materialBlurV.replaceShader( quadVert, cubemapBlurFrag( 1 ) );
      } );
    }

    const quadBlurH = new Quad( {
      material: materialBlurH,
      target: targetBlurH,
    } );

    const quadBlurV = new Quad( {
      material: materialBlurV,
      target: targetBlurV,
    } );

    if ( import.meta.env.DEV ) {
      quadBlurH.name = 'quadBlurH';
      quadBlurV.name = 'quadBlurV';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lambdaSwapTargetSample,
      ...cameras,
      ...blitsCompile,
      quadSample,
      quadMerge,
      quadBlurH,
      quadBlurV,
    ];

    // -- buffer names -----------------------------------------------------------------------------
    if ( import.meta.env.DEV ) {
      const id = Math.floor( 1E9 * Math.random() );

      cameras.map( ( camera, i ) => {
        camera.name = `CubemapNode${ id }/CameraStack${ i }`;
        targetCompiled.name = `CubemapNode${ id }/cubemapCompiled`;
        swapTargetSample.i.name = `CubemapNode${ id }/cubemapSample/swap0`;
        swapTargetSample.o.name = `CubemapNode${ id }/cubemapSample/swap1`;
        targetMerge.name = `CubemapNode${ id }/cubemapMerge`;
      } );
    }
  }
}
