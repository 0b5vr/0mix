import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { DoFResources } from './DoFResources';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { PerspectiveCamera } from '../../../heck/components/PerspectiveCamera';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { dofBlurFrag } from './shaders/dofBlurFrag';
import { dofPostFrag } from './shaders/dofPostFrag';
import { dofPresortFrag } from './shaders/dofPresortFrag';
import { dofTileGatherFrag } from './shaders/dofTileGatherFrag';
import { dofTileMaxFrag } from './shaders/dofTileMaxFrag';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface DoFOptions {
  input: BufferTextureRenderTarget;
  deferredCamera: PerspectiveCamera;
  deferredTarget: BufferTextureRenderTarget;
  target: RenderTarget;
  params: [
    depth: number,
    size: number,
  ];
  resources: DoFResources;
}

export class DoF extends SceneNode {
  public resources: DoFResources;

  private _materialTileMaxH: Material;
  private _materialPresort: Material;

  public constructor( options: DoFOptions ) {
    super();

    const {
      input,
      deferredCamera,
      deferredTarget,
      target,
      params,
      resources,
    } = options;

    // -- buffers ----------------------------------------------------------------------------------
    const [
      targetTileMaxH,
      targetTileMaxV,
      targetTileGather,
      targetPresort,
      targetBlur,
    ] = this.resources = resources;

    // -- materials --------------------------------------------------------------------------------
    const materialTileMaxH = this._materialTileMaxH = new Material(
      quadVert,
      dofTileMaxFrag( false ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialTileMaxH.addUniform( 'cameraNearFar', '2f', deferredCamera.near, deferredCamera.far );
    materialTileMaxH.addUniform( 'dofDepthSize', '2f', ...params );
    materialTileMaxH.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      deferredTarget.textures[ 1 ],
    );

    const materialTileMaxV = new Material(
      quadVert,
      dofTileMaxFrag( true ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialTileMaxV.addUniform( 'cameraNearFar', '2f', deferredCamera.near, deferredCamera.far );
    materialTileMaxV.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      targetTileMaxH.texture,
    );

    const materialTileGather = new Material(
      quadVert,
      dofTileGatherFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialTileGather.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      targetTileMaxV.texture,
    );

    const materialPresort = this._materialPresort = new Material(
      quadVert,
      dofPresortFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialPresort.addUniform( 'cameraNearFar', '2f', deferredCamera.near, deferredCamera.far );
    materialPresort.addUniform( 'dofDepthSize', '2f', ...params );
    materialPresort.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      deferredTarget.textures[ 1 ],
    );
    materialPresort.addUniformTextures(
      'samplerTile',
      GL_TEXTURE_2D,
      targetTileGather.texture,
    );

    const materialBlur = new Material(
      quadVert,
      dofBlurFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

    materialBlur.addUniformTextures( 'sampler0', GL_TEXTURE_2D, input.texture );
    materialBlur.addUniformTextures(
      'samplerTile',
      GL_TEXTURE_2D,
      targetTileGather.texture,
    );
    materialBlur.addUniformTextures(
      'samplerPresort',
      GL_TEXTURE_2D,
      targetPresort.texture,
    );

    const materialPost = new Material(
      quadVert,
      dofPostFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );

    materialPost.addUniformTextures( 'sampler0', GL_TEXTURE_2D, input.texture );
    materialPost.addUniformTextures( 'sampler1', GL_TEXTURE_2D, targetBlur.texture );
    materialPost.addUniformTextures( 'samplerPresort', GL_TEXTURE_2D, targetPresort.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/dofTileMaxFrag', ( { dofTileMaxFrag } ) => {
        materialTileMaxH.replaceShader( quadVert, dofTileMaxFrag( false ) );
        materialTileMaxV.replaceShader( quadVert, dofTileMaxFrag( true ) );
      } );

      import.meta.hot.accept( './shaders/dofTileGatherFrag', ( { dofTileGatherFrag } ) => {
        materialTileGather.replaceShader( quadVert, dofTileGatherFrag );
      } );

      import.meta.hot.accept( './shaders/dofPresortFrag', ( { dofPresortFrag } ) => {
        materialPresort.replaceShader( quadVert, dofPresortFrag );
      } );

      import.meta.hot.accept( './shaders/dofBlurFrag', ( { dofBlurFrag } ) => {
        materialBlur.replaceShader( quadVert, dofBlurFrag );
      } );

      import.meta.hot.accept( './shaders/dofPostFrag', ( { dofPostFrag } ) => {
        materialPost.replaceShader( quadVert, dofPostFrag );
      } );
    }

    // -- quads ------------------------------------------------------------------------------------
    const quadTileMaxH = new Quad( {
      target: targetTileMaxH,
      material: materialTileMaxH,
    } );
    const quadTileMaxV = new Quad( {
      target: targetTileMaxV,
      material: materialTileMaxV,
    } );
    const quadTileGather = new Quad( {
      target: targetTileGather,
      material: materialTileGather,
    } );
    const quadPresort = new Quad( {
      target: targetPresort,
      material: materialPresort,
    } );
    const quadBlur = new Quad( {
      target: targetBlur,
      material: materialBlur,
    } );
    const quadPost = new Quad( {
      target,
      material: materialPost,
    } );

    if ( import.meta.env.DEV ) {
      quadTileMaxH.name = 'quadTileMaxH';
      quadTileMaxV.name = 'quadTileMaxV';
      quadTileGather.name = 'quadTileGather';
      quadPresort.name = 'quadPresort';
      quadBlur.name = 'quadBlur';
      quadPost.name = 'quadPost';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      quadTileMaxH,
      quadTileMaxV,
      quadTileGather,
      quadPresort,
      quadBlur,
      quadPost,
    ];
  }

  public setParams( ...params: [
    depth: number,
    size: number,
  ] ): void {
    this._materialTileMaxH.addUniform( 'dofDepthSize', '2f', ...params );
    this._materialPresort.addUniform( 'dofDepthSize', '2f', ...params );
  }
}
