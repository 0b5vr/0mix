import { EventType, on } from '../../globals/globalEvent';
import { createCameraStackResources, resizeCameraStackResources } from './CameraStackResources';

export const mainCameraStackResources = createCameraStackResources( true, true, true );

if ( import.meta.env.DEV ) {
  mainCameraStackResources[ 1 ]!.name = 'aoTarget';
  mainCameraStackResources[ 2 ]!.i.name = 'aoDenoiserSwap0';
  mainCameraStackResources[ 2 ]!.o.name = 'aoDenoiserSwap1';
  mainCameraStackResources[ 3 ]!.name = 'shadeTarget';
  mainCameraStackResources[ 4 ]!.i.name = 'denoiserSwap0';
  mainCameraStackResources[ 4 ]!.o.name = 'denoiserSwap1';
}

on( EventType.Resize, ( [ width, height ] ) => (
  resizeCameraStackResources( mainCameraStackResources, width, height )
) );
