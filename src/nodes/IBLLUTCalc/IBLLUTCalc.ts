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
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { emit, EventType } from '../../globals/globalEvent';

export class IBLLUTCalc extends SceneNode {
  public constructor() {
    super();

    this.visible = false;

    // -- swap -------------------------------------------------------------------------------------
    const swap = new Swap(
      new BufferTextureRenderTarget(
        IBLLUT_SIZE,
        IBLLUT_SIZE,
      ),
      new BufferTextureRenderTarget(
        IBLLUT_SIZE,
        IBLLUT_SIZE,
      ),
    );

    glTextureFilter( swap.i.texture, GL_NEAREST );
    glTextureFilter( swap.o.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      swap.i.name = 'IBLLUTCalc/swap0';
      swap.o.name = 'IBLLUTCalc/swap1';
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
    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, swap.i.texture );

    const quad = new Quad( {
      target: swap.o,
      material,
    } );

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    // -- swapper ----------------------------------------------------------------------------------
    const swapper = new Lambda( {
      onUpdate: () => {
        samples ++;
        swap.swap();

        if ( samples > IBLLUT_ITER ) {
          this.active = false; // THE LAMBDA ITSELF WILL ALSO BE DEACTIVATED
        } else {
          material.addUniform( 'samples', '1f', samples );
          material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
          material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, swap.i.texture );

          quad.target = swap.o;
        }
      },
    } );

    if ( import.meta.env.DEV ) {
      swapper.name = 'swapper';
    }

    // -- updater ----------------------------------------------------------------------------------
    const lambdaUpdater = new Lambda( {
      onUpdate: () => {
        emit( EventType.IBLLUT, swap.o.texture );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdater.name = 'lambdaUpdater';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      swapper,
      quad,
      lambdaUpdater,
    ];
  }
}
