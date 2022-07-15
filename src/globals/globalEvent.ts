export enum EventType {
  ComponentUpdate,
  CameraFov,
  CameraDoF,
  CameraFog,
}

export type Event = {
  [ EventType.ComponentUpdate ]: string;
  [ EventType.CameraFov ]: number;
  [ EventType.CameraDoF ]: [ depth: number, size: number ];
  [ EventType.CameraFog ]: [ brightness: number, near: number, far: number ];
};

export type EventListener<T extends EventType> = ( event: Event[T] ) => void;

const listeners: Map<EventType, Set<EventListener<any>>> = new Map();

export function on<T extends EventType>(
  type: T,
  listener: EventListener<T>,
): EventListener<T> {
  let set = listeners.get( type );

  if ( !set ) {
    set = new Set();
    listeners.set( type, set );
  }

  set.add( listener );

  return listener;
}

export function emit<T extends EventType>(
  ...[ type, event ]: Event[T] extends void ? [ T ] : [ T, Event[T] ]
): void {
  const set = listeners.get( type );

  if ( set ) {
    for ( const listener of set ) {
      listener( event );
    }
  }
}
