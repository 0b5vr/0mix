export class MapOfSet<K, V> {
  public readonly map: Map<K, Set<V>>;

  public constructor() {
    this.map = new Map();
  }

  public get( key: K ): Set<V> {
    return this.map.get( key ) ?? new Set();
  }

  public add( key: K, value: V ): void {
    let set = this.map.get( key );
    if ( set == null ) {
      set = new Set();
      this.map.set( key, set );
    }
    set.add( value );
  }
}
