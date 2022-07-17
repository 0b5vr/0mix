export abstract class BiquadFilter {
  protected __x1: number;
  protected __x2: number;
  protected __y1: number;
  protected __y2: number;

  protected abstract __a1a0: number;
  protected abstract __a2a0: number;
  protected abstract __b0a0: number;
  protected abstract __b1a0: number;
  protected abstract __b2a0: number;

  public constructor() {
    this.__x1 = 0.0;
    this.__x2 = 0.0;
    this.__y1 = 0.0;
    this.__y2 = 0.0;
  }

  public process( x0: number ): number {
    const y0 = (
      this.__b0a0 * x0
      + this.__b1a0 * this.__x1
      + this.__b2a0 * this.__x2
      - this.__a1a0 * this.__y1
      - this.__a2a0 * this.__y2
    );

    this.__x2 = this.__x1;
    this.__x1 = x0;
    this.__y2 = this.__y1;
    this.__y1 = y0;

    return y0;
  }
}
