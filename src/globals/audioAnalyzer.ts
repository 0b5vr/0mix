import { audio } from './audio';
import { audioAnalyzerObservers } from './globalObservers';
import { notifyObservers } from '@0b5vr/experimental';

export const audioAnalyzerSplitter = audio.createChannelSplitter( 2 );

const audioAnalyzerL = audio.createAnalyser();
const audioAnalyzerR = audio.createAnalyser();

audioAnalyzerL.fftSize = 4096;
audioAnalyzerR.fftSize = 4096;

audioAnalyzerSplitter.connect( audioAnalyzerL, 0 );
audioAnalyzerSplitter.connect( audioAnalyzerR, 1 );

export const audioAnalyzerTimeDomainL = new Float32Array( 1024 );
export const audioAnalyzerTimeDomainR = new Float32Array( 1024 );

export function updateAudioAnalyzer(): void {
  audioAnalyzerL.getFloatTimeDomainData( audioAnalyzerTimeDomainL );
  audioAnalyzerR.getFloatTimeDomainData( audioAnalyzerTimeDomainR );
  notifyObservers( audioAnalyzerObservers );
}
