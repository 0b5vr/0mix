import { GL_UNSIGNED_SHORT } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { TAU } from '../utils/constants';
import { glCreateIndexbuffer } from '../gl/glCreateIndexbuffer';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindIndexbuffer } from '../gl/glVertexArrayBindIndexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

export function genTorus( outerRadius = 1.0, innerRadius = 0.1 ): Geometry {
  const outerSegs = 64;
  const innerSegs = 8;

  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];
  const arrayIndex: number[] = [];

  for ( let io = 0; io < outerSegs; io ++ ) {
    const to = TAU * io / outerSegs;
    const xo = Math.cos( to );
    const yo = Math.sin( to );

    for ( let ii = 0; ii < innerSegs; ii ++ ) {
      const ti = TAU * ii / innerSegs;

      const i0 = innerSegs * io + ii;
      const i1 = innerSegs * io + ( ( ii + 1 ) % innerSegs );
      const i2 = innerSegs * ( ( io + 1 ) % outerSegs ) + ii;
      const i3 = innerSegs * ( ( io + 1 ) % outerSegs ) + ( ( ii + 1 ) % innerSegs );

      arrayPosition.push(
        xo * ( outerRadius + innerRadius * Math.cos( ti ) ),
        yo * ( outerRadius + innerRadius * Math.cos( ti ) ),
        innerRadius * Math.sin( ti ),
      );

      arrayNormal.push(
        xo * Math.cos( ti ),
        yo * Math.cos( ti ),
        Math.sin( ti ),
      );

      arrayIndex.push(
        i0, i2, i3,
        i0, i3, i1,
      );
    }
  }

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );
  const normal = glCreateVertexbuffer( new Float32Array( arrayNormal ) );
  const index = glCreateIndexbuffer( new Uint16Array( arrayIndex ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();
  geometry.count = arrayIndex.length;
  geometry.indexType = GL_UNSIGNED_SHORT;

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );
  glVertexArrayBindIndexbuffer( geometry.vao, index );

  return geometry;
}
