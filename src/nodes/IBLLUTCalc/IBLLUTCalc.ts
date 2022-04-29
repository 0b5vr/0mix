import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { IBLLUT_ITER, IBLLUT_SIZE } from '../../config';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { iblLutFrag } from './shaders/iblLutFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { vdc } from '../../utils/vdc';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../gl/constants';

export const IBLLUTCalcTag = Symbol();

export class IBLLUTCalc extends SceneNode {
  public swap: Swap<BufferRenderTarget>;

  public get texture(): WebGLTexture {
    return this.swap.o.texture;
  }

  public constructor() {
    super();

    this.visible = false;
    this.tags.push( IBLLUTCalcTag );

    // -- swap -------------------------------------------------------------------------------------
    this.swap = new Swap(
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        filter: GL_NEAREST,
      } ),
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        filter: GL_NEAREST,
      } ),
    );

    if ( import.meta.env.DEV ) {
      this.swap.i.name = 'IBLLUTCalc/swap0';
      this.swap.o.name = 'IBLLUTCalc/swap1';
    }

    // -- post -------------------------------------------------------------------------------------
    let samples = 0.0;

    const material = new Material(
      quadVert,
      iblLutFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    material.addUniform( 'samples', '1f', samples );
    material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, this.swap.i.texture );

    const quad = new Quad( {
      target: this.swap.o,
      material,
    } );

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    // -- swapper ----------------------------------------------------------------------------------
    const swapper = new Lambda( {
      onUpdate: () => {
        samples ++;
        this.swap.swap();

        if ( samples > IBLLUT_ITER ) {
          this.active = false; // THE LAMBDA ITSELF WILL ALSO BE DEACTIVATED
        } else {
          material.addUniform( 'samples', '1f', samples );
          material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
          material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, this.swap.i.texture );

          quad.target = this.swap.o;
        }
      },
    } );

    if ( import.meta.env.DEV ) {
      swapper.name = 'swapper';
    }

    this.children.push( swapper, quad );
  }
}
