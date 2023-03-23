import { Accumulator } from '../common/Accumulator';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { GL_REPEAT, GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { SceneNode } from '../../heck/components/SceneNode';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { glTextureWrap } from '../../gl/glTextureWrap';
import { moonTexGenFrag } from './shaders/moonTexGenFrag';
import { moonTexModFrag } from './shaders/moonTexModFrag';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export class MoonTexGen extends SceneNode {
  public texture: WebGLTexture;

  public constructor() {
    super( { visible: false } );

    // -- texture calc -----------------------------------------------------------------------------
    const accumTexGen = new Accumulator( {
      width: 2048,
      height: 2048,
      frag: moonTexGenFrag,
      iter: 100,
    } );

    glTextureWrap( accumTexGen.swap.i.texture, GL_REPEAT );
    glTextureWrap( accumTexGen.swap.o.texture, GL_REPEAT );

    if ( import.meta.env.DEV ) {
      accumTexGen.swap.i.name = 'MoonTexGen/swap0';
      accumTexGen.swap.o.name = 'MoonTexGen/swap1';
    }

    // -- texture modify ---------------------------------------------------------------------------
    const target = new BufferTextureRenderTarget( 2048, 2048 );
    this.texture = target.texture;

    glTextureWrap( target.texture, GL_REPEAT );

    if ( import.meta.env.DEV ) {
      target.name = 'MoonTexGen/mod';
    }

    const material = new Material(
      quadVert,
      moonTexModFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );
    material.addUniformTextures( 'sampler0', GL_TEXTURE_2D, accumTexGen.swap.i.texture );

    const quad = new Quad( {
      target,
      material,
    } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/moonTexModFrag',
        ( { moonTexModFrag } ) => {
          material.replaceShader(
            quadVert,
            moonTexModFrag,
          ).then( () => {
            quad.drawImmediate();
          } );
        },
      );
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      accumTexGen,
      quad,
      new Lambda( {
        onUpdate: () => {
          this.active = accumTexGen.active;
        },
      } ),
    ];
  }
}
