import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { EventType, on } from '../../../globals/globalEvent';
import { GLTextureFormatStuffR11G11B10F, GLTextureFormatStuffRG16F, GLTextureFormatStuffRGBA16F } from '../../../gl/glSetTexture';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../../gl/constants';
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
import { glTextureFilter } from '../../../gl/glTextureFilter';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface DoFOptions {
  input: BufferTextureRenderTarget;
  deferredCamera: PerspectiveCamera;
  deferredTarget: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class DoF extends SceneNode {
  public constructor( options: DoFOptions ) {
    super();

    const { input, deferredCamera, deferredTarget, target } = options;
    const { width, height } = target;

    // -- buffers ----------------------------------------------------------------------------------
    const targetTileMaxH = new BufferTextureRenderTarget(
      width / 16,
      height,
      1,
      GLTextureFormatStuffRG16F,
    );
    const targetTileMaxV = new BufferTextureRenderTarget(
      width / 16,
      height / 16,
      1,
      GLTextureFormatStuffRG16F,
    );
    const targetTileGather = new BufferTextureRenderTarget(
      width / 16,
      height / 16,
      1,
      GLTextureFormatStuffRG16F,
    );
    const targetPresort = new BufferTextureRenderTarget(
      width,
      height,
      1,
      GLTextureFormatStuffR11G11B10F,
    );
    const targetBlur = new BufferTextureRenderTarget(
      width,
      height,
      1,
      GLTextureFormatStuffRGBA16F,
    );

    glTextureFilter( targetTileMaxH.texture, GL_NEAREST );
    glTextureFilter( targetTileMaxV.texture, GL_NEAREST );
    glTextureFilter( targetTileGather.texture, GL_NEAREST );
    glTextureFilter( targetPresort.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      targetTileMaxH.name = 'DoF/TileMaxH';
      targetTileMaxV.name = 'DoF/TileMaxV';
      targetTileGather.name = 'DoF/TileGather';
      targetPresort.name = 'DoF/Presort';
      targetBlur.name = 'DoF/Blur';
    }

    // -- materials --------------------------------------------------------------------------------
    const materialTileMaxH = new Material(
      quadVert,
      dofTileMaxFrag( false ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialTileMaxH.addUniform( 'cameraNearFar', '2f', deferredCamera.near, deferredCamera.far );
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

    const materialPresort = new Material(
      quadVert,
      dofPresortFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialPresort.addUniform( 'cameraNearFar', '2f', deferredCamera.near, deferredCamera.far );
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

    // -- event listener ---------------------------------------------------------------------------
    on( EventType.Camera, ( o ) => {
      const [ depth, size ] = o?.dof ?? [ 0.0, 0.0 ];

      // TODO: blitDry

      materialTileMaxH.addUniform( 'dofDepthSize', '2f', depth, size );
      materialPresort.addUniform( 'dofDepthSize', '2f', depth, size );
    } );

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
}
