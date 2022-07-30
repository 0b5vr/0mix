export class Memo<
  TValue,
  TArgs extends any[] = [],
> {
  public gen: ( ...args: TArgs ) => TValue;
  private __map: Map<symbol, TValue>;

  public constructor( gen: ( ...args: TArgs ) => TValue ) {
    this.gen = gen;
    this.__map = new Map();
  }

  public get(
    key: symbol | undefined,
    ...args: Parameters<( ...args: TArgs ) => TValue>
  ): TValue {
    let value = key && this.__map.get( key );

    if ( !value ) {
      value = this.gen( ...args );
      key && this.__map.set( key, value );
    }

    return value;
  }
}
