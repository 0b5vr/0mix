import { ALIGN_SIZE, pixelSorterFrag } from './shaders/pixelSorterFrag';
import { Blit } from '../../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
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

const TARGET_WIDTH = 2048;

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
      new BufferTextureRenderTarget( width, height ),
      new BufferTextureRenderTarget( width, height ),
    );

    const bufferIndex = new BufferTextureRenderTarget( width, height );

    resizeObservers.push( ( [ width, height ] ) => {
      swap.i.resize( width, height );
      swap.o.resize( width, height );
      bufferIndex.resize( width, height );
    } );

    glTextureFilter( swap.i.texture, GL_NEAREST );
    glTextureFilter( swap.o.texture, GL_NEAREST );
    glTextureFilter( bufferIndex.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      swap.i.name = 'PixelSorter/swap0';
      swap.o.name = 'PixelSorter/swap1';
      bufferIndex.name = 'PixelSorter/index';
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
    let indexWidth = 1;
    const indexMaterials: Material[] = [];

    while ( indexWidth < TARGET_WIDTH ) {
      const isLast = ( indexWidth * 8 >= TARGET_WIDTH );

      const material = new Material(
        quadVert,
        pixelSorterIndexFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
      );

      material.addUniform( 'indexWidth', '1f', indexWidth );
      material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, input.texture );
      material.addUniformTextures( 'sampler1', GL_TEXTURE_2D, swap.o.texture );

      if ( import.meta.hot ) {
        import.meta.hot.accept( './shaders/pixelSorterIndexFrag', ( { pixelSorterIndexFrag } ) => {
          material.replaceShader( quadVert, pixelSorterIndexFrag );
        } );
      }

      indexMaterials.push( material );

      const quad = new Quad( {
        target: isLast ? bufferIndex : swap.i,
        material,
      } );

      if ( import.meta.env.DEV ) {
        quad.name = `quadIndex-${ indexWidth }`;
      }

      nodeMain.children.push( quad );

      swap.swap();

      indexWidth *= 8;
    }

    // -- sort -------------------------------------------------------------------------------------
    let dir = 1.0;
    let comp = 1.0;

    while ( dir < ALIGN_SIZE ) {
      const isFirst = dir === 1.0;
      const isLast = ( dir === ALIGN_SIZE / 2.0 ) && ( comp === 1.0 );

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
        bufferIndex.texture,
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
        dir *= 2.0;
        comp = dir;
      } else {
        comp /= 2.0;
      }
    }

    // -- update uniform ---------------------------------------------------------------------------
    auto( 'PixelSorter/amp', ( { value } ) => {
      indexMaterials.map( ( material ) => material.addUniform( 'threshold', '1f', value ) );

      nodeMain.active = value > 1E-3;
      nodeBypass.active = !nodeMain.active;
    } );
  }
}
