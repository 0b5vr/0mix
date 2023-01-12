import { RawVector3, Xorshift } from '@0b5vr/experimental';
import { TAU } from '../../utils/constants';

export function vec3UniformSphere( rng: Xorshift ): RawVector3 {
  const phi = TAU * rng.gen();
  const sinTheta = 1.0 - 2.0 * rng.gen();
  const cosTheta = Math.sqrt( 1.0 - sinTheta * sinTheta );

  return [
    cosTheta * Math.cos( phi ),
    cosTheta * Math.sin( phi ),
    sinTheta,
  ];
}
