import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { GL_LINEAR } from '../../gl/constants';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { glTextureFilter } from '../../gl/glTextureFilter';

export class ShaderRenderTarget extends BufferTextureRenderTarget {
  public material: Material;
  public quad: Quad;

  public constructor( width: number, height: number, frag: string ) {
    super( width, height );
    glTextureFilter( this.texture, GL_LINEAR );

    const material = this.material = new Material(
      quadVert,
      frag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 } },
    );

    const quad = this.quad = new Quad( {
      material,
      target: this,
    } );
    quad.drawImmediate();
  }

  public createUpdateLambda(): Lambda {
    return new Lambda( {
      onUpdate: ( { time, deltaTime } ) => this.quad.drawImmediate( {
        time,
        deltaTime,
      } ),
    } );
  }
}
