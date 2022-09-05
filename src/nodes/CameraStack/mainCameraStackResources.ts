import { EventType, on } from '../../globals/globalEvent';
import { createCameraStackResources, resizeCameraStackResources } from './CameraStackResources';

export const mainCameraStackResources = createCameraStackResources( true, true, true );

on( EventType.Resize, ( [ width, height ] ) => (
  resizeCameraStackResources( mainCameraStackResources, width, height )
) );
