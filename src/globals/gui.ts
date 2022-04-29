import { GPUMeasureHandler } from './gui/GPUMeasureHandler';
import { GPUTimer } from './gui/GPUTimer';
import { NullMeasureHandler } from './gui/NullMeasureHandler';
import type { ImPane } from '@0b5vr/imtweakpane';

export let gui: ImPane | undefined;
let profilerUpdateCpu: any | undefined;
let profilerUpdateGpu: any | undefined;
let profilerDrawCpu: any | undefined;
let profilerDrawGpu: any | undefined;

export const promiseGui = new Promise<ImPane>( ( resolve ) => {
  if ( import.meta.env.DEV ) {
    import( '@0b5vr/imtweakpane' ).then( ( { ImPane } ) => {
      const gui_ = new ImPane( { title: 'gui' } );

      gui_.value( 'active', true );

      const tpDfwv = gui_.pane.element.parentNode! as HTMLDivElement;
      tpDfwv.style.zIndex = '100';

      const gpuTimer = GPUTimer.isSupported() ? new GPUTimer() : null;
      const createGPUMeasureHandler = (): any => (
        gpuTimer != null ? new GPUMeasureHandler( gpuTimer ) : new NullMeasureHandler()
      );

      import( '@0b5vr/tweakpane-plugin-profiler' ).then( ( plugin ) => {
        gui_.pane.registerPlugin( plugin as any );

        gui_.value( 'profilers/active', false );

        profilerUpdateCpu = gui_.blade( 'profilers/update/cpu', {
          view: 'profiler',
          label: 'cpu',
        } );

        profilerUpdateGpu = gui_.blade( 'profilers/update/gpu', {
          view: 'profiler',
          label: 'gpu',
          measureHandler: createGPUMeasureHandler(),
        } );

        gui_.value( 'profilers/draw/camera', '' );

        profilerDrawCpu = gui_.blade( 'profilers/draw/cpu', {
          view: 'profiler',
          label: 'cpu',
          targetDelta: 1,
        } );

        profilerDrawGpu = gui_.blade( 'profilers/draw/gpu', {
          view: 'profiler',
          label: 'gpu',
          targetDelta: 1,
          measureHandler: createGPUMeasureHandler(),
        } );

        gui = gui_;
        resolve( gui_ );
      } );
    } );
  } else {
    // no promise resolution for you!
  }
} );

export function guiMeasureUpdate( name: string, fn: () => void ): void {
  if (
    import.meta.env.DEV &&
    profilerUpdateCpu != null &&
    profilerUpdateGpu != null &&
    gui?.value( 'profilers/active' )
  ) {
    profilerUpdateCpu.measure( name, () => {
      profilerUpdateGpu.measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}

export function guiMeasureDraw( name: string, fn: () => void ): void {
  if (
    import.meta.env.DEV &&
    profilerDrawCpu != null &&
    profilerDrawGpu != null &&
    gui?.value( 'profilers/active' )
  ) {
    profilerDrawCpu.measure( name, () => {
      profilerDrawGpu.measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}
