import { GL_UNSIGNED_SHORT } from '../gl/constants';
import { Geometry } from '../heck/Geometry';
import { HALF_PI, PI } from '../utils/constants';
import { glCreateIndexbuffer } from '../gl/glCreateIndexbuffer';
import { glCreateVertexbuffer } from '../gl/glCreateVertexbuffer';
import { glVertexArrayBindIndexbuffer } from '../gl/glVertexArrayBindIndexbuffer';
import { glVertexArrayBindVertexbuffer } from '../gl/glVertexArrayBindVertexbuffer';

export function genCube( options?: {
  dimension?: [ number, number, number ];
  flipNormal?: boolean; // TODO: this sucks
} ): Geometry {
  const dimension = options?.dimension ?? [ 1, 1, 1 ];
  const flipNormal = options?.flipNormal ?? false;

  const arrayPosition: number[] = [];
  const arrayNormal: number[] = [];
  const arrayUv: number[] = [];
  const arrayIndex: number[] = [];

  const chunkPosition = [
    [ -1, -1,  1 ],
    [  1, -1,  1 ],
    [ -1,  1,  1 ],
    [  1,  1,  1 ],
  ];
  const chunkNormal = [
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
  ];
  const chunkUv = [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 0, 1 ],
    [ 1, 1 ],
  ];

  for ( let i = 0; i < 6; i ++ ) {
    const rotate = ( v: number[] ): number[] => {
      const vt: number[] = [];

      if ( i < 4 ) {
        const t = i * HALF_PI;
        vt[ 0 ] = Math.cos( t ) * v[ 0 ] - Math.sin( t ) * v[ 2 ];
        vt[ 1 ] = v[ 1 ];
        vt[ 2 ] = Math.sin( t ) * v[ 0 ] + Math.cos( t ) * v[ 2 ];
      } else {
        const t = ( i - 0.5 ) * PI;
        vt[ 0 ] = v[ 0 ];
        vt[ 1 ] = Math.cos( t ) * v[ 1 ] - Math.sin( t ) * v[ 2 ];
        vt[ 2 ] = Math.sin( t ) * v[ 1 ] + Math.cos( t ) * v[ 2 ];
      }

      return vt;
    };

    const scale = ( v: number[] ): number[] => {
      return [
        v[ 0 ] * dimension[ 0 ],
        v[ 1 ] * dimension[ 1 ],
        v[ 2 ] * dimension[ 2 ],
      ];
    };

    arrayPosition.push( ...chunkPosition.map( rotate ).map( scale ).flat() );
    arrayNormal.push( ...chunkNormal.map( rotate ).flat() );
    arrayUv.push( ...chunkUv.flat() );
    arrayIndex.push( ...[ 0, 1, 3, 0, 3, 2 ].map( ( v ) => v + 4 * i ) );
  }

  if ( flipNormal ) {
    arrayNormal.map( ( _, i ) => {
      arrayNormal[ i ] *= -1.0;
    } );
  }

  // -- buffers ------------------------------------------------------------------------------------
  const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );
  const normal = glCreateVertexbuffer( new Float32Array( arrayNormal ) );
  const uv = glCreateVertexbuffer( new Float32Array( arrayUv ) );
  const index = glCreateIndexbuffer( new Uint16Array( arrayIndex ) );

  // -- geometry -----------------------------------------------------------------------------------
  const geometry = new Geometry();
  geometry.count = arrayIndex.length;
  geometry.indexType = GL_UNSIGNED_SHORT;

  glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );
  glVertexArrayBindVertexbuffer( geometry.vao, uv, 2, 2 );
  glVertexArrayBindIndexbuffer( geometry.vao, index );

  return geometry;
}
