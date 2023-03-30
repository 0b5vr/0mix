import { GL_LINES } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

export function genWireCube( dimension?: [ number, number, number ] ): Geometry {
  const [ x, y, z ] = dimension ?? [ 1, 1, 1 ];

  const arrayPosition = [
    -x, -y, z,
    x, -y, z,
    x, -y, z,
    x, y, z,
    x, y, z,
    -x, y, z,
    -x, y, z,
    -x, -y, z,

    -x, -y, -z,
    x, -y, -z,
    x, -y, -z,
    x, y, -z,
    x, y, -z,
    -x, y, -z,
    -x, y, -z,
    -x, -y, -z,

    -x, -y, z,
    -x, -y, -z,
    x, -y, z,
    x, -y, -z,
    x, y, z,
    x, y, -z,
    -x, y, z,
    -x, y, -z,
  ];

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();
  geometry.count = arrayPosition.length / 3;
  geometry.mode = GL_LINES;

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );

  return geometry;
}
