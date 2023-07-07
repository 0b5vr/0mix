export interface Music {
  get isPlaying(): boolean;
  get time(): number;
  set time( time: number );
  get deltaTime(): number;
  get cueStatus(): string;
  get gainNode(): GainNode;

  play(): void;
  pause(): void;
  update(): void;
}
