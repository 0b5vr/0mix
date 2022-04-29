import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { Material } from '../../heck/Material';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { shadowBlurFrag } from './shaders/shadowBlurFrag';
import { GL_TEXTURE_2D } from '../../gl/constants';

export const PointLightTag = Symbol();

export interface PointLightNodeOptions extends SceneNodeOptions {
  scene: SceneNode;
  shadowMapFov?: number;
  shadowMapNear?: number;
  shadowMapFar?: number;
  shadowMapSize?: number;
}

export class PointLightNode extends SceneNode {
  public spotness: number = 0.0;
  public spotSharpness: number = 0.5;
  public color: [ number, number, number ] = [ 1.0, 1.0, 1.0 ];
  public camera: PerspectiveCamera;
  public shadowMap: BufferRenderTarget;

  public get shadowMapFov(): number {
    return this.camera.fov;
  }

  public get shadowMapNear(): number {
    return this.camera.near;
  }

  public get shadowMapFar(): number {
    return this.camera.far;
  }

  public constructor( options: PointLightNodeOptions ) {
    super( options );

    this.tags.push( PointLightTag );

    const swapOptions = {
      width: options.shadowMapSize ?? 256,
      height: options.shadowMapSize ?? 256,
    };

    const swap = new Swap(
      new BufferRenderTarget( swapOptions ),
      new BufferRenderTarget( swapOptions )
    );

    // -- camera -----------------------------------------------------------------------------------
    const fov = options.shadowMapFov ?? 45.0;
    const near = options.shadowMapNear ?? 0.1;
    const far = options.shadowMapFar ?? 100.0;

    this.camera = new PerspectiveCamera( {
      fov,
      near,
      far,
      renderTarget: swap.o,
      scene: options.scene,
      exclusionTags: [ PointLightTag ],
      materialTag: 'depth',
    } );
    this.camera.clear = [ 1.0, 1.0, 1.0, 1.0 ];
    this.children.push( this.camera );

    if ( import.meta.env.DEV ) {
      this.camera.name = 'shadowMapCamera';
    }

    swap.swap();

    // -- blur -------------------------------------------------------------------------------------
    for ( let i = 0; i < 2; i ++ ) {
      const material = new Material(
        quadVert,
        shadowBlurFrag( i === 1 ),
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
      );
      material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, swap.i.texture );

      const quadShadowBlur = new Quad( {
        target: swap.o,
        material,
      } );

      if ( import.meta.env.DEV ) {
        quadShadowBlur.name = `quadShadowBlur${ i }`;
      }

      this.children.push( quadShadowBlur );

      swap.swap();
    }

    // -- this is the shadow map -------------------------------------------------------------------
    this.shadowMap = swap.i;
  }
}
