import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW } from '../../gl/constants';
import { RawQuaternion, RawVector3, Xorshift, arraySerial, mat4Compose, mod, quatFromAxisAngle, quatMultiply, vecScale } from '@0b5vr/experimental';
import { gl } from '../../globals/canvas';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { quatRandom } from './quatRandom';
import { vec3UniformSphere } from './vec3UniformSphere';

export const SEVEN_SEG_PRIMCOUNT = 512;

type SevenSegTransform = [
  position: RawVector3,
  rotation: RawQuaternion,
  scale: RawVector3,
  rotAxis: RawVector3,
];

export class SevenSegTransforms {
  public transforms: SevenSegTransform[];
  public array: Float32Array;
  public buffer: WebGLBuffer;

  public constructor() {
    const rng = new Xorshift();

    this.transforms = arraySerial( SEVEN_SEG_PRIMCOUNT ).map( () => [
      [ 5.0 - 10.0 * rng.gen(), 5.0 - 10.0 * rng.gen(), 5.0 - 10.0 * rng.gen() ],
      quatRandom( rng ),
      vecScale( [ 1.0, 1.0, 1.0 ], 0.1 + rng.gen() * rng.gen() * rng.gen() ),
      vec3UniformSphere( rng ),
    ] );

    this.array = new Float32Array( 16 * SEVEN_SEG_PRIMCOUNT );
    this.buffer = glCreateVertexbuffer( null );
  }

  public update( time: number ): void {
    const { transforms, array, buffer } = this;

    for ( let i = 0; i < SEVEN_SEG_PRIMCOUNT; i ++ ) {
      const [ position, rotation, scale, rotAxis ] = transforms[ i ];

      const posT = [
        position[ 0 ],
        mod( position[ 1 ] + time, 10.0 ) - 5.0,
        position[ 2 ],
      ] as RawVector3;
      const rotT = quatMultiply( rotation, quatFromAxisAngle( rotAxis, time ) );

      array.set( mat4Compose( posT, rotT, scale ), 16 * i );
    }

    gl.bindBuffer( GL_ARRAY_BUFFER, buffer );
    gl.bufferData( GL_ARRAY_BUFFER, array, GL_DYNAMIC_DRAW );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );
  }
}
