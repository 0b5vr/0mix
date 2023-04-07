import { ALIGN_SIZE, pixelSorterFrag } from './shaders/pixelSorterFrag';
import { Blit } from '../../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffRG16F, GLTextureFormatStuffRGBA8 } from '../../../gl/glSetTexture';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { glTextureFilter } from '../../../gl/glTextureFilter';
import { pixelSorterIndexFrag } from './shaders/pixelSorterIndexFrag';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';
import { resizeObservers } from '../../../globals/globalObservers';

export interface PixelSorterOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class PixelSorter extends SceneNode {
  public constructor( options: PixelSorterOptions ) {
    super();

    const { input, target } = options;
    const { width, height } = target;
    this.visible = false;

    const nodeBypass = new SceneNode();
    nodeBypass.visible = false;

    const nodeMain = new SceneNode();
    nodeMain.active = false;
    nodeMain.visible = false;

    if ( import.meta.env.DEV ) {
      nodeBypass.name = 'nodeBypass';
      nodeMain.name = 'nodeMain';
    }

    this.children = [
      nodeBypass,
      nodeMain,
    ];

    // -- buffers ----------------------------------------------------------------------------------
    const swap = new Swap(
      new BufferTextureRenderTarget( width, height, 1, GLTextureFormatStuffRGBA8 ),
      new BufferTextureRenderTarget( width, height, 1, GLTextureFormatStuffRGBA8 ),
    );

    const indexSwap = new Swap(
      new BufferTextureRenderTarget( width, height, 1, GLTextureFormatStuffRG16F ),
      new BufferTextureRenderTarget( width, height, 1, GLTextureFormatStuffRG16F ),
    );

    resizeObservers.push( ( [ width, height ] ) => {
      swap.i.resize( width, height );
      swap.o.resize( width, height );
      indexSwap.i.resize( width, height );
      indexSwap.o.resize( width, height );
    } );

    glTextureFilter( swap.i.texture, GL_NEAREST );
    glTextureFilter( swap.o.texture, GL_NEAREST );
    glTextureFilter( indexSwap.i.texture, GL_NEAREST );
    glTextureFilter( indexSwap.o.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      swap.i.name = 'PixelSorter/swap0';
      swap.o.name = 'PixelSorter/swap1';
      indexSwap.i.name = 'PixelSorter/indexSwap0';
      indexSwap.o.name = 'PixelSorter/indexSwap1';
    }

    // -- bypass -----------------------------------------------------------------------------------
    const blitBypass = new Blit( {
      src: options.input,
      dst: options.target,
    } );

    if ( import.meta.env.DEV ) {
      blitBypass.name = 'blitBypass';
    }

    nodeBypass.children.push( blitBypass );

    // -- calc index -------------------------------------------------------------------------------
    const indexMaterials: Material[] = [ 1, 16, 256 ].map( ( indexWidth ) => {
      const material = new Material(
        quadVert,
        pixelSorterIndexFrag( indexWidth ),
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
      );

      material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, input.texture );
      material.addUniformTextures( 'sampler1', GL_TEXTURE_2D, indexSwap.o.texture );

      if ( import.meta.hot ) {
        import.meta.hot.accept( './shaders/pixelSorterIndexFrag', ( { pixelSorterIndexFrag } ) => {
          material.replaceShader( quadVert, pixelSorterIndexFrag( indexWidth ) );
        } );
      }

      const quad = new Quad( {
        target: indexSwap.i,
        material,
      } );

      if ( import.meta.env.DEV ) {
        quad.name = `quadIndex-${ indexWidth }`;
      }

      nodeMain.children.push( quad );

      indexSwap.swap();

      return material;
    } );

    // -- sort -------------------------------------------------------------------------------------
    let dir = 2.0;
    let comp = 1.0;
    let isFirst = true;

    while ( dir <= ALIGN_SIZE ) {
      const isLast = ( dir === ALIGN_SIZE ) && ( comp === 1.0 );

      const material = new Material(
        quadVert,
        pixelSorterFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
      );

      material.addUniform( 'dir', '1f', dir );
      material.addUniform( 'comp', '1f', comp );
      material.addUniformTextures(
        'sampler0',
        GL_TEXTURE_2D,
        ( isFirst ? options.input : swap.o ).texture,
      );
      material.addUniformTextures(
        'sampler1',
        GL_TEXTURE_2D,
        indexSwap.o.texture,
      );

      if ( import.meta.hot ) {
        import.meta.hot.accept( './shaders/pixelSorterFrag', ( { pixelSorterFrag } ) => {
          material.replaceShader( quadVert, pixelSorterFrag );
        } );
      }

      const quad = new Quad( {
        target: isLast ? options.target : swap.i,
        material,
      } );

      if ( import.meta.env.DEV ) {
        quad.name = `quad-${ dir }-${ comp }`;
      }

      nodeMain.children.push( quad );

      swap.swap();

      if ( comp === 1.0 ) {
        comp = dir;
        dir *= 2.0;
      } else {
        comp /= 2.0;
      }
      isFirst = false;
    }

    // -- update uniform ---------------------------------------------------------------------------
    auto( 'PixelSorter/amp', ( { value } ) => {
      indexMaterials.map( ( material ) => material.addUniform( 'threshold', '1f', value ) );

      nodeMain.active = value > 1E-3;
      nodeBypass.active = !nodeMain.active;
    } );
  }
}
