import { ComponentUpdateEvent } from '../heck/components/Component';
import { Observer } from '../utils/Observer';

export const resizeObservers: Observer<[ width: number, height: number ]>[] = [];
export const editorVisibleObservers: Observer<boolean>[] = [];
export const musicRendererStatusObservers: Observer<'none' | 'compiling' | 'applying'>[] = [];
export const preparationProgressObservers: Observer<number>[] = [];
export const audioAnalyzerObservers: Observer<void>[] = [];
export const componentUpdateObservers: Observer<ComponentUpdateEvent>[] = [];
