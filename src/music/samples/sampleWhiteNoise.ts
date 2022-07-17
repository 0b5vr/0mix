import { SAMPLE_TEXTURE_SIZE_SQ } from '../constants';
import { Xorshift } from '@0b5vr/experimental';

export const sampleWhiteNoise = new Float32Array( SAMPLE_TEXTURE_SIZE_SQ );

const rng = new Xorshift();

for ( let i = 0; i < SAMPLE_TEXTURE_SIZE_SQ; i ++ ) {
  sampleWhiteNoise[ i ] = rng.gen() * 2.0 - 1.0;
}
