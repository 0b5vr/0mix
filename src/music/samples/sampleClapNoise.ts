import { BPF } from './BPF';
import { sampleWhiteNoise } from './sampleWhiteNoise';

const bpf = new BPF( 1200.0, 2.0 );

export const sampleClapNoise = sampleWhiteNoise.map( ( v ) => (
  bpf.process( v )
) );
