export interface MusicEngine {
  get isPlaying(): boolean;
  get time(): number;
  set time( time: number );
  get deltaTime(): number;
  get cueStatus(): 'none' | 'compiling' | 'applying';
  get gainNode(): GainNode;

  play(): void;
  pause(): void;
  update(): void;
}
