import { GLDrawMode } from '../gl/glDrawMode';
import { GLIndexType } from '../gl/GLIndexType';
import { GL_TRIANGLES, GL_UNSIGNED_SHORT } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { TAU } from '../utils/constants';
import { glCreateIndexbuffer } from '../gl/glCreateIndexbuffer';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindIndexbuffer } from '../gl/glVertexArrayBindIndexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

interface ResultGenCylinder {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  uv: WebGLBuffer;
  index: WebGLBuffer;
  geometry: Geometry;
  count: number;
  mode: GLDrawMode;
  indexType: GLIndexType;
}

export function genCylinder( options?: {
  radius?: number,
  height?: number,
  radialSegs?: number,
  heightSegs?: number,
} ): ResultGenCylinder {
  const radius = options?.radius ?? 1.0;
  const height = ( options?.height ?? 2.0 ) * 0.5;
  const radialSegs = options?.radialSegs ?? 16;
  const heightSegs = options?.heightSegs ?? 1;

  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];
  const arrayUv: number[] = [];
  const arrayIndex: number[] = [];

  for ( let ih = 0; ih < heightSegs + 1; ih ++ ) {
    const v = ih / heightSegs;
    const z = 1.0 - v * 2.0;
    for ( let ir = 0; ir < radialSegs; ir ++ ) {
      const i = ih * radialSegs + ir;
      const i1 = i + 1;

      const t = TAU * ir / radialSegs;
      const x = Math.cos( t );
      const y = Math.sin( t );

      arrayPosition.push( radius * x, radius * y, height * z );
      arrayNormal.push( x, y, 0.0 );
      arrayUv.push( ir / radialSegs, v );

      if ( ih !== heightSegs ) {
        arrayIndex.push(
          i, i + radialSegs + 1, i1 + radialSegs + 1,
          i, i1 + radialSegs + 1, i1,
        );
      }
    }

    arrayPosition.push( radius, 0.0, height * z );
    arrayNormal.push( 1.0, 0.0, 0.0 );
    arrayUv.push( 1.0, v );
  }

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );
  const normal = glCreateVertexbuffer( new Float32Array( arrayNormal ) );
  const uv = glCreateVertexbuffer( new Float32Array( arrayUv ) );
  const index = glCreateIndexbuffer( new Uint16Array( arrayIndex ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, uv, 2, 2 );
  glVertexArrayBindIndexbuffer( geometry.vao, index );

  const count = geometry.count = arrayIndex.length;
  const mode = geometry.mode = GL_TRIANGLES;
  const indexType = geometry.indexType = GL_UNSIGNED_SHORT;

  return {
    position,
    normal,
    uv,
    index,
    geometry,
    count,
    mode,
    indexType,
  };
}
