import { Component, ComponentUpdateEvent } from '../heck/components/Component';
import type { CubemapNode } from '../nodes/CubemapNode/CubemapNode';

export enum EventType {
  ComponentUpdate,
  Camera,
  IBLLUT,
  CubeMap,
}

export type Event = {
  [ EventType.ComponentUpdate ]: {
    component: Component;
    event: ComponentUpdateEvent;
    path: string;
  };
  [ EventType.Camera ]: {
    fov?: number;
    dof?: [ depth: number, size: number ];
    fog?: [ brightness: number, near: number, far: number ];
  } | void;
  [ EventType.IBLLUT ]: WebGLTexture;
  [ EventType.CubeMap ]: CubemapNode | void;
};

export type EventListener<T extends EventType>
  = Event[T] extends void ? () => void : ( event: Event[T] ) => void;

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
