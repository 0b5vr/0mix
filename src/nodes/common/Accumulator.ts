import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

interface AccumulatorOptions {
  width: number;
  height: number;
  frag: string;
  iter: number;
}

export class Accumulator extends SceneNode {
  public samples: number;
  public iter: number;
  public swap: Swap<BufferTextureRenderTarget>;
  public material: Material;

  public constructor( options: AccumulatorOptions ) {
    super( { visible: false } );

    const { width, height, frag, iter } = options;

    this.samples = 0;
    this.iter = iter;

    // -- swap -------------------------------------------------------------------------------------
    const swap = this.swap = new Swap(
      new BufferTextureRenderTarget( width, height ),
      new BufferTextureRenderTarget( width, height ),
    );

    // -- draw -------------------------------------------------------------------------------------
    const material = this.material = new Material(
      quadVert,
      frag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );

    const quad = new Quad( {
      target: swap.o,
      material: material,
    } );

    // -- swapper ----------------------------------------------------------------------------------
    const swapper = new Lambda( {
      onUpdate: () => {
        this.samples ++;
        swap.swap();

        if ( this.samples > this.iter ) {
          this.active = false; // THE LAMBDA ITSELF WILL ALSO BE DEACTIVATED
        } else {
          material.addUniform( 'samples', '1f', this.samples );
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
