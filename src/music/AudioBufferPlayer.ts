import { audio } from '../globals/audio';

export class AudioBufferPlayer {
  public gainNode: GainNode;
  public buffer?: AudioBuffer;

  private __currentSource?: AudioBufferSourceNode | null;
  private __beginTime: number;
  private __pausedTime: number;

  public get isPlaying(): boolean {
    return this.__currentSource != null;
  }

  public get time(): number {
    if ( this.__currentSource != null ) {
      return audio.currentTime - this.__beginTime;
    } else {
      return this.__pausedTime;
    }
  }

  public set time( time: number ) {
    const { isPlaying } = this;

    this.pause();
    this.__pausedTime = time;

    if ( isPlaying ) {
      this.play();
    }
  }

  public constructor() {
    this.gainNode = audio.createGain();

    this.__beginTime = 0.0;
    this.__pausedTime = 0.0;
  }

  public play(): void {
    this.pause();

    this.__currentSource = audio.createBufferSource();
    this.__currentSource.connect( this.gainNode );
    this.__currentSource.buffer = this.buffer!;
    this.__currentSource.start( 0.0, this.__pausedTime );

    this.__beginTime = audio.currentTime - this.__pausedTime;
  }

  public pause(): void {
    if ( this.__currentSource != null ) {
      this.__currentSource.stop();
      this.__currentSource.disconnect();
      this.__currentSource = null;

      this.__pausedTime = audio.currentTime - this.__beginTime;
    }
  }
}
