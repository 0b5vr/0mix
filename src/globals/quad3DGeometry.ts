import { GL_TRIANGLE_STRIP } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

const position = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );
const normal = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );
const uv = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

export const quad3DGeometry = new Geometry();
glVertexArrayBindVertexbuffer( quad3DGeometry.vao, position, 0, 3 );
glVertexArrayBindVertexbuffer( quad3DGeometry.vao, normal, 1, 3 );
glVertexArrayBindVertexbuffer( quad3DGeometry.vao, uv, 2, 2 );

quad3DGeometry.count = 4;
quad3DGeometry.mode = GL_TRIANGLE_STRIP;
