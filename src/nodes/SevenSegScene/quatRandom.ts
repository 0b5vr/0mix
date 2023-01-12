import { RawQuaternion, Xorshift } from '@0b5vr/experimental';
import { TAU } from '../../utils/constants';

export function quatRandom( rng: Xorshift ): RawQuaternion {
  const u = rng.gen();
  const v = TAU * rng.gen();
  const w = TAU * rng.gen();

  const sqrtU = Math.sqrt( u );
  const sqrt1U = Math.sqrt( 1.0 - u );

  return [
    sqrt1U * Math.sin( v ),
    sqrt1U * Math.cos( v ),
    sqrtU * Math.sin( w ),
    sqrtU * Math.cos( w ),
  ];
}
