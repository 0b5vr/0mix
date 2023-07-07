import { MusicEngine } from './MusicEngine';
import { audio } from '../globals/audio';
import { audioAnalyzerSplitter } from '../globals/audioAnalyzer';
import { audioReverb } from '../globals/audioReverb';
import { promiseGui } from '../globals/gui';

export class Music {
  public get isPlaying(): boolean {
    return this.__engine?.isPlaying ?? false;
  }

  public get time(): number {
    return this.__engine?.time ?? 0.0;
  }

  public set time( time: number ) {
    if ( this.__engine ) {
      this.__engine.time = time;
    }
  }

  public get deltaTime(): number {
    return this.__engine?.deltaTime ?? 0.0;
  }

  public get cueStatus(): 'none' | 'compiling' | 'applying' {
    return this.__engine?.cueStatus ?? 'none';
  }

  private __engine?: MusicEngine;

  public setEngine( engine: MusicEngine ): void {
    this.__engine = engine;

    engine.gainNode.connect( audioAnalyzerSplitter );
    engine.gainNode.connect( audioReverb );
    engine.gainNode.connect( audio.destination );

    if ( import.meta.env.DEV ) {
      engine.gainNode.gain.value = 0.0;
      promiseGui.then( ( gui ) => {
        gui.input( 'audio/volume', 0.0, { min: 0.0, max: 1.0 } )?.on( 'change', ( { value } ) => {
          engine.gainNode.gain.value = value;
        } );
      } );
    }
  }

  public play(): void {
    this.__engine?.play();
  }

  public pause(): void {
    this.__engine?.pause();
  }

  public update(): void {
    this.__engine?.update();
  }
}
