import { Blit } from '../../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { auto } from '../../../globals/automaton';
import { dctEncodeFrag } from './shaders/dctEncodeFrag';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { glTextureFilter } from '../../../gl/glTextureFilter';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface DCTOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class DCT extends SceneNode {
  public constructor( options: DCTOptions ) {
    super();

    const { input, target } = options;
    const { width, height } = target;

    // -- dry --------------------------------------------------------------------------------------
    const blitDry = new Blit( {
      src: input,
      dst: target,
    } );

    if ( import.meta.env.DEV ) {
      blitDry.name = 'blitDry';
    }

    // -- buffers ----------------------------------------------------------------------------------
    const targetEncodeH = new BufferTextureRenderTarget( width, height );
    const targetEncodeV = new BufferTextureRenderTarget( width, height );
    const targetDecodeH = new BufferTextureRenderTarget( width, height );

    glTextureFilter( targetEncodeH.texture, GL_NEAREST );
    glTextureFilter( targetEncodeV.texture, GL_NEAREST );
    glTextureFilter( targetDecodeH.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      targetEncodeH.name = 'DCT/targetEncodeH';
      targetEncodeV.name = 'DCT/targetEncodeV';
      targetDecodeH.name = 'DCT/targetDecodeH';
    }

    // -- materials --------------------------------------------------------------------------------
    const materialEncodeH = new Material(
      quadVert,
      dctEncodeFrag( false, false ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialEncodeH.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      input.texture,
    );

    const materialEncodeV = new Material(
      quadVert,
      dctEncodeFrag( true, false ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialEncodeV.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      targetEncodeH.texture,
    );

    const materialDecodeH = new Material(
      quadVert,
      dctEncodeFrag( false, true ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialDecodeH.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      targetEncodeV.texture,
    );

    const materialDecodeV = new Material(
      quadVert,
      dctEncodeFrag( true, true ),
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
      },
    );
    materialDecodeV.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      targetDecodeH.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/dctEncodeFrag', ( { dctEncodeFrag } ) => {
        materialEncodeH.replaceShader( quadVert, dctEncodeFrag( false, false ) );
        materialEncodeV.replaceShader( quadVert, dctEncodeFrag( true, false ) );
        materialDecodeH.replaceShader( quadVert, dctEncodeFrag( false, true ) );
        materialDecodeV.replaceShader( quadVert, dctEncodeFrag( true, true ) );
      } );

      // -- quads ------------------------------------------------------------------------------------
      const quadEncodeH = new Quad( {
        target: targetEncodeH,
        material: materialEncodeH,
      } );
      const quadEncodeV = new Quad( {
        target: targetEncodeV,
        material: materialEncodeV,
      } );
      const quadDecodeH = new Quad( {
        target: targetDecodeH,
        material: materialDecodeH,
      } );
      const quadDecodeV = new Quad( {
        target,
        material: materialDecodeV,
      } );

      if ( import.meta.env.DEV ) {
        quadEncodeH.name = 'quadEncodeH';
        quadEncodeV.name = 'quadEncodeV';
        quadDecodeH.name = 'quadDecodeH';
        quadDecodeV.name = 'quadDecodeV';
      }

      // -- event listener ---------------------------------------------------------------------------
      auto( 'DCT/amp', ( { value } ) => {
        const enable = value > 0.0;

        blitDry.active = !enable;
        quadEncodeH.active = enable;
        quadEncodeV.active = enable;
        quadDecodeH.active = enable;
        quadDecodeV.active = enable;

        materialEncodeV.addUniform( 'amp', '1f', value );
      } );

      // -- children ---------------------------------------------------------------------------------
      this.children = [
        blitDry,
        quadEncodeH,
        quadEncodeV,
        quadDecodeH,
        quadDecodeV,
      ];
    }
  }
}
