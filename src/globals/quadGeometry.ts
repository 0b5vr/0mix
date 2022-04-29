import { Geometry } from '../heck/Geometry';
import { TRIANGLE_STRIP_QUAD } from '@0b5vr/experimental';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';
import { GL_TRIANGLE_STRIP } from '../gl/constants';

const quadBuffer = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

export const quadGeometry = new Geometry();
glVertexArrayBindVertexbuffer( quadGeometry.vao, quadBuffer, 0, 2 );

quadGeometry.count = 4;
quadGeometry.mode = GL_TRIANGLE_STRIP;
