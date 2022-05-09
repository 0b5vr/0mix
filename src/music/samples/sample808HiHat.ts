import { sampleRate } from '../../globals/audio';
import { SAMPLE_TEXTURE_SIZE_SQ } from '../constants';
import { HPF } from './HPF';

export const sample808HiHat = new Float32Array( SAMPLE_TEXTURE_SIZE_SQ );

const hpf1 = new HPF( 5900.0, 2.0 );
const hpf2 = new HPF( 6500.0, 2.0 );

for ( let i = 0; i < SAMPLE_TEXTURE_SIZE_SQ; i ++ ) {
  // "metallic" osc
  for ( let iOsc = 0; iOsc < 6; iOsc ++ ) {
    const freq = Math.pow( 2.0, 8.0 + 0.22 * iOsc );
    const phase = freq * i / sampleRate;
    sample808HiHat[ i ] += ( phase % 1.0 ) < 0.5 ? -0.2 : 0.2;
  }

  // hpf 1
  sample808HiHat[ i ] = hpf1.process( sample808HiHat[ i ] );

  // wave shaper
  sample808HiHat[ i ] = Math.sign( sample808HiHat[ i ] ) * Math.pow( Math.abs( sample808HiHat[ i ] ), 0.1 );

  // hpf 2
  sample808HiHat[ i ] = hpf2.process( sample808HiHat[ i ] );
}
