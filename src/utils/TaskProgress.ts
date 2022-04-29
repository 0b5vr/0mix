import { saturate } from '@0b5vr/experimental';

export class TaskProgress {
  public promise: Promise<void>;
  public onProgress?: ( progress: number ) => void;

  public constructor(
    fn: ( setProgress: ( progress: number ) => void ) => Promise<void>
  ) {
    const setProgress = ( progress: number ): void => this.onProgress?.( saturate( progress ) );
    this.promise = fn( setProgress );
  }
}
