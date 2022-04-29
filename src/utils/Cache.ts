export class Cache<T> {
  private __cache: T;
  public needsUpdate: boolean;
  public update: () => T;

  public constructor( init: T, update: () => T ) {
    this.__cache = init;
    this.needsUpdate = false;
    this.update = update;
  }

  public get value(): T {
    if ( this.needsUpdate ) {
      this.__cache = this.update();
      this.needsUpdate = false;
    }

    return this.__cache;
  }

  public setValue( value: T ): void {
    this.__cache = value;
    this.needsUpdate = false;
  }
}
