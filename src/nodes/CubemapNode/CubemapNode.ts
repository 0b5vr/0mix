import { Blit } from '../../heck/components/Blit';
import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { CameraStack } from '../CameraStack/CameraStack';
import { ComponentOptions } from '../../heck/components/Component';
import { DustTag } from '../Dust/Dust';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { PointLightTag } from '../Lights/PointLightNode';
import { Quad } from '../../heck/components/Quad';
import { RawQuaternion, Swap } from '@0b5vr/experimental';
import { SceneNode } from '../../heck/components/SceneNode';
// import { StuffTag } from './Stuff';
import { auto } from '../../globals/automaton';
import { cubemapBlurFrag } from './shaders/cubemapBlurFrag';
import { cubemapMergeFrag } from './shaders/cubemapMergeFrag';
import { cubemapSampleFrag } from './shaders/cubemapSampleFrag';
import { dummyRenderTarget } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { GL_TEXTURE_2D } from '../../gl/constants';

export const CubemapNodeTag = Symbol();

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
}

export class CubemapNode extends SceneNode {
  public targetDry: BufferRenderTarget;
  public targetWet: BufferRenderTarget;

  public constructor( options: CubemapNodeOptions ) {
    super( options );

    this.visible = false;
    this.tags.push( CubemapNodeTag );

    this.transform.position = [ 0.0, 3.0, 0.0 ];

    const { scene } = options;

    // -- cubemap ----------------------------------------------------------------------------------
    const targets = [ ...Array( 6 ) ].map( () => new BufferRenderTarget( {
      width: 256,
      height: 256,
    } ) );

    if ( import.meta.env.DEV ) {
      targets.map( ( target, i ) => target.name = `cubemapTarget${ i }` );
    }

    // -- cameras ----------------------------------------------------------------------------------
    const cameras = targets.map( ( target, i ) => {
      const cameraStack = new CameraStack( {
        width: 256,
        height: 256,
        scene,
        exclusionTags: [ /* StuffTag, */ PointLightTag, DustTag ],
        target,
        near: 2.9,
        fov: 90.0,
      } );

      if ( import.meta.env.DEV ) {
        cameraStack.name = `cubemapCameraStack${ i }`;
      }

      cameraStack.transform.rotation = CUBEMAP_ROTATIONS[ i ];

      return cameraStack;
    } );

    // -- compiler ---------------------------------------------------------------------------------
    const targetCompiled = this.targetDry = new BufferRenderTarget( {
      width: 768,
      height: 512,
    } );

    if ( import.meta.env.DEV ) {
      targetCompiled.name = 'cubemapCompiled';
    }

    const blitsCompile = targets.map( ( src, i ) => {
      const x = 256 * Math.floor( i / 2 );
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
      new BufferRenderTarget( {
        width: 768,
        height: 512,
      } ),
      new BufferRenderTarget( {
        width: 768,
        height: 512,
      } ),
    );

    if ( import.meta.env.DEV ) {
      swapTargetSample.i.name = 'cubemapSample/swap0';
      swapTargetSample.o.name = 'cubemapSample/swap1';
    }

    const materialSample = new Material(
      quadVert,
      cubemapSampleFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialSample.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetCompiled.texture,
    );

    auto( 'cubemap/accumMix', ( { value } ) => {
      materialSample.addUniform( 'accumMix', '1f', value );
    } );

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept( './shaders/cubemapSampleFrag', ( { cubemapSampleFrag } ) => {
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
    const targetMerge = new BufferRenderTarget( {
      width: 768,
      height: 512,
    } );

    if ( import.meta.env.DEV ) {
      targetMerge.name = 'cubemapMerge';
    }

    const materialMerge = new Material(
      quadVert,
      cubemapMergeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept( './shaders/cubemapMergeFrag', ( { cubemapMergeFrag } ) => {
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
    const targetBlurH = new BufferRenderTarget( {
      width: 768,
      height: 512,
    } );

    const targetBlurV = this.targetWet = new BufferRenderTarget( {
      width: 768,
      height: 512,
    } );

    if ( import.meta.env.DEV ) {
      targetBlurH.name = 'cubemapBlurH';
      targetBlurV.name = 'cubemapBlurV';
    }

    const materialBlurH = new Material(
      quadVert,
      cubemapBlurFrag( 0 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialBlurH.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetMerge.texture,
    );

    const materialBlurV = new Material(
      quadVert,
      cubemapBlurFrag( 1 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialBlurV.addUniformTextures(
      'samplerCubemap',
      GL_TEXTURE_2D,
      targetBlurH.texture,
    );

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept( './shaders/cubemapBlurFrag', ( { cubemapBlurFrag } ) => {
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
  }
}
