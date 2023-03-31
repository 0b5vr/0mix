import { audio, sampleRate } from './audio';

const samples = 4.0 * sampleRate;
const buffer = audio.createBuffer( 2, samples, sampleRate );

for ( let iCh = 0; iCh < 2; iCh ++ ) {
  const ch = buffer.getChannelData( iCh );

  for ( let i = 0; i < samples; i ++ ) {
    const t = i / sampleRate;
    ch[ i ] = i === 0 ? 1.0 : 0.001 * ( Math.random() - 0.5 ) * Math.exp( -5.0 * t );
  }
}

export const audioConvolver = audio.createConvolver();
audioConvolver.buffer = buffer;

audioConvolver.connect( audio.destination );
