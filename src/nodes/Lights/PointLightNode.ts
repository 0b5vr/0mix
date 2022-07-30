import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { FAR, NEAR } from '../../config';
import { GLTextureFormatStuffRG16F } from '../../gl/glSetTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { PerspectiveCamera } from '../../heck/components/PerspectiveCamera';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { shadowBlurFrag } from './shaders/shadowBlurFrag';

export const PointLightTag = Symbol();

export interface PointLightNodeOptions extends SceneNodeOptions {
  scene: SceneNode;
  shadowMapFov?: number;
  shadowMapNear?: number;
  shadowMapFar?: number;
  shadowMapSize?: number;
}

export class PointLightNode extends SceneNode {
  public spotness = 0.0;
  public spotSharpness = 0.5;
  public color: [ number, number, number ] = [ 1.0, 1.0, 1.0 ];
  public camera: PerspectiveCamera;
  public shadowMap: BufferTextureRenderTarget;

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

    const shadowMapSize = options.shadowMapSize ?? 1024;

    const swap = new Swap(
      new BufferTextureRenderTarget( shadowMapSize, shadowMapSize, 1, GLTextureFormatStuffRG16F ),
      new BufferTextureRenderTarget( shadowMapSize, shadowMapSize, 1, GLTextureFormatStuffRG16F )
    );

    if ( import.meta.env.DEV ) {
      const id = Math.floor( 1E9 * Math.random() );
      swap.i.name = `PointLightNode${ id }/shadow/0`;
      swap.o.name = `PointLightNode${ id }/shadow/1`;
    }

    // -- camera -----------------------------------------------------------------------------------
    const fov = options.shadowMapFov ?? 45.0;
    const near = options.shadowMapNear ?? NEAR;
    const far = options.shadowMapFar ?? FAR;

    this.camera = new PerspectiveCamera( {
      fov,
      near,
      far,
      target: swap.o,
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
