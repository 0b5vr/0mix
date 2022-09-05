import { EventType, on } from '../../globals/globalEvent';
import { createCameraStackResources, resizeCameraStackResources } from './CameraStackResources';

export const mainCameraStackResources = createCameraStackResources( true, true, true );

if ( import.meta.env.DEV ) {
  mainCameraStackResources[ 1 ]!.name = 'aoTarget';
}

on( EventType.Resize, ( [ width, height ] ) => (
  resizeCameraStackResources( mainCameraStackResources, width, height )
) );
