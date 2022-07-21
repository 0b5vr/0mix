import { GLDrawMode } from '../gl/glDrawMode';
import { GL_TRIANGLES } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { HALF_PI } from '../utils/constants';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';
import { range, vecAdd, vecMultiply, vecNormalize } from '@0b5vr/experimental';
import { vec3AzimuthAltitude } from '../utils/vec3AzimuthAltitude';

interface ResultGenOctahedron {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  geometry: Geometry;
  count: number;
  mode: GLDrawMode;
}

export function genOctahedron( subdiv = 0 ): ResultGenOctahedron {
  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];

  for ( let ii = 0; ii < 2; ii ++ ) {
    for ( let iq = 0; iq < 4; iq ++ ) {
      for ( let iy = 0; iy < subdiv + 1; iy ++ ) {
        for ( let ix = 0; ix < iy + 1; ix ++ ) {
          const t0 = range(       iy, 0.0, subdiv + 1.0, HALF_PI, 0.0 );
          const t1 = range( iy + 1.0, 0.0, subdiv + 1.0, HALF_PI, 0.0 );

          const p0 = range( ix - 1.0, 0.0, iy || 1.0, 0.0, HALF_PI ) + iq * HALF_PI;
          const p1 = range(       ix, 0.0,  iy + 1.0, 0.0, HALF_PI ) + iq * HALF_PI;
          const p2 = range(       ix, 0.0, iy || 1.0, 0.0, HALF_PI ) + iq * HALF_PI;
          const p3 = range( ix + 1.0, 0.0,  iy + 1.0, 0.0, HALF_PI ) + iq * HALF_PI;

          let v1 = vec3AzimuthAltitude( p0, t0 );
          let v2 = vec3AzimuthAltitude( p1, t1 );
          let v3 = vec3AzimuthAltitude( p2, t0 );
          let v4 = vec3AzimuthAltitude( p3, t1 );

          if ( ii ) { // === 1
            v1 = vecMultiply( [ -1.0, -1.0, 1.0 ], v1 );
            v2 = vecMultiply( [ -1.0, -1.0, 1.0 ], v2 );
            v3 = vecMultiply( [ -1.0, -1.0, 1.0 ], v3 );
            v4 = vecMultiply( [ -1.0, -1.0, 1.0 ], v4 );
          }

          if ( ix !== 0 ) {
            arrayPosition.push(
              ...v1,
              ...v2,
              ...v3,
            );

            {
              const n = vecNormalize( vecAdd( v2, v3, v1 ) );

              arrayNormal.push(
                ...n,
                ...n,
                ...n,
              );
            }
          }

          {
            arrayPosition.push(
              ...v2,
              ...v4,
              ...v3,
            );

            {
              const n = vecNormalize( vecAdd( v2, v3, v4 ) );

              arrayNormal.push(
                ...n,
                ...n,
                ...n,
              );
            }
          }
        }
      }
    }
  }

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );
  const normal = glCreateVertexbuffer( new Float32Array( arrayNormal ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );

  const count = geometry.count = arrayPosition.length / 3;
  const mode = geometry.mode = GL_TRIANGLES;

  return {
    position,
    normal,
    geometry,
    count,
    mode,
  };
}
