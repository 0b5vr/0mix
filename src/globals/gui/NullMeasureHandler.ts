export class NullMeasureHandler {
  public measure( fn: () => void ): number {
    fn();
    return 0.0;
  }
}
