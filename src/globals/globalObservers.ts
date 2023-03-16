import { ComponentUpdateEvent } from '../heck/components/Component';

type Observer<T> = ( arg: T ) => void;

export const resizeObservers: Observer<[ width: number, height: number ]>[] = [];
export const preparationProgressObservers: Observer<number>[] = [];
export const componentUpdateObservers: Observer<ComponentUpdateEvent>[] = [];
export const ibllutObservers: Observer<WebGLTexture>[] = [];
export const shaderEventApplyObservers: Observer<void>[] = [];
export const shaderEventAlterObservers: Observer<void>[] = [];
