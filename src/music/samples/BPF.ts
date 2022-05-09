import { sampleRate } from '../../globals/audio';
import { BiquadFilter } from './BiquadFilter';

export class BPF extends BiquadFilter {
  protected __a1a0: number;
  protected __a2a0: number;
  protected __b0a0: number;
  protected __b1a0: number;
  protected __b2a0: number;

  public constructor( f0: number, Q: number ) {
    super();

    const omega0 = 2.0 * Math.PI * f0 / sampleRate;
    const cosOmega0 = Math.cos( omega0 );
    const sinOmega0 = Math.sin( omega0 );
    const alpha = 0.5 * sinOmega0 / Q;

    const a0 = 1.0 + alpha;
    this.__a1a0 = ( -2.0 * cosOmega0 ) / a0;
    this.__a2a0 = ( 1.0 - alpha ) / a0;
    this.__b0a0 = sinOmega0 / 2.0 / a0;
    this.__b1a0 = 0.0;
    this.__b2a0 = -this.__b0a0;
  }
}
