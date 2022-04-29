export abstract class RenderTarget {
  public abstract viewport: [ number, number, number, number ];

  public get width(): number {
    return this.viewport[ 2 ];
  }

  public get height(): number {
    return this.viewport[ 3 ];
  }

  public abstract bind(): void;
}
