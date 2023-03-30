import { ComponentUpdateEvent } from '../heck/components/Component';

export type Observer<T> = ( arg: T ) => void;

export const resizeObservers: Observer<[ width: number, height: number ]>[] = [];
export const editorVisibleObservers: Observer<boolean>[] = [];
export const preparationProgressObservers: Observer<number>[] = [];
export const audioAnalyzerObservers: Observer<void>[] = [];
export const componentUpdateObservers: Observer<ComponentUpdateEvent>[] = [];
export const shaderEventApplyObservers: Observer<void>[] = [];
export const shaderEventAlterObservers: Observer<void>[] = [];
