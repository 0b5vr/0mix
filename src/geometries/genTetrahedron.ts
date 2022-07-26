import { Geometry } from '../heck/Geometry';
import { REC_SQRT3 } from '../utils/constants';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

export function genTetrahedron(): Geometry {
  const arrayPosition = new Float32Array( [
    1, -1, 1,
    1, 1, -1,
    -1, 1, 1,

    1, 1, -1,
    1, -1, 1,
    -1, -1, -1,

    -1, 1, 1,
    1, 1, -1,
    -1, -1, -1,

    1, -1, 1,
    -1, 1, 1,
    -1, -1, -1,
  ] );

  const arrayNormal = new Float32Array( [
    REC_SQRT3, REC_SQRT3, REC_SQRT3,
    REC_SQRT3, REC_SQRT3, REC_SQRT3,
    REC_SQRT3, REC_SQRT3, REC_SQRT3,

    REC_SQRT3, -REC_SQRT3, -REC_SQRT3,
    REC_SQRT3, -REC_SQRT3, -REC_SQRT3,
    REC_SQRT3, -REC_SQRT3, -REC_SQRT3,

    -REC_SQRT3, REC_SQRT3, -REC_SQRT3,
    -REC_SQRT3, REC_SQRT3, -REC_SQRT3,
    -REC_SQRT3, REC_SQRT3, -REC_SQRT3,

    -REC_SQRT3, -REC_SQRT3, REC_SQRT3,
    -REC_SQRT3, -REC_SQRT3, REC_SQRT3,
    -REC_SQRT3, -REC_SQRT3, REC_SQRT3,
  ] );

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( arrayPosition );
  const normal = glCreateVertexbuffer( arrayNormal );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();
  geometry.count = 12;

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );

  return geometry;
}
