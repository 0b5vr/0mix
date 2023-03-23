import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { GL_NEAREST, GL_TEXTURE_2D } from '../../gl/constants';
import { IBLLUT_ITER, IBLLUT_SIZE } from '../../config';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { iblLutFrag } from './shaders/iblLutFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { vdc } from '../../utils/vdc';

const swap = new Swap(
  new BufferTextureRenderTarget( IBLLUT_SIZE, IBLLUT_SIZE ),
  new BufferTextureRenderTarget( IBLLUT_SIZE, IBLLUT_SIZE ),
);

export const ibllutTexture = swap.i.texture;

glTextureFilter( swap.i.texture, GL_NEAREST );
glTextureFilter( swap.o.texture, GL_NEAREST );

if ( import.meta.env.DEV ) {
  swap.i.name = 'ibllutTexture/swap0';
  swap.o.name = 'ibllutTexture/swap1';
}

export class IBLLUTCalc extends SceneNode {
  public constructor() {
    super();

    this.visible = false;

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

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      swapper,
      quad,
    ];
  }
}
