import { GL_LINE_STRIP } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { deferredWhiteUnlitFrag } from '../../shaders/common/deferredWhiteUnlitFrag';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';

export class InstancedLines extends Mesh {
  public deferred: Material;

  public constructor(
    vert: string,
    lineLength: number,
    lines: number,
  ) {
    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();
    geometry.primcount = lines;
    geometry.count = lineLength;
    geometry.mode = GL_LINE_STRIP;

    const bufferInstanceArray = new Float32Array( Math.max( lineLength, lines ) )
      .map( ( _, i ) => i );
    const bufferInstance = glCreateVertexbuffer( bufferInstanceArray );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 0, 1 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 1, 1, 1 );

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      vert,
      deferredWhiteUnlitFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    // -- mesh -------------------------------------------------------------------------------------
    super( {
      geometry,
      materials: { deferred },
    } );

    this.deferred = deferred;
  }
}
