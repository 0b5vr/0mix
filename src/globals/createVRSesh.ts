import { VRSesh } from './vr/VRSesh';
import { gl } from './canvas';
import type { Navigator } from 'webxr';

const xr = ( window.navigator as any as Navigator ).xr;

export async function createVRSesh(): Promise<VRSesh> {
  const session = await xr.requestSession(
    'immersive-vr',
    { requiredFeatures: [ 'local-floor' ] },
  );

  await ( gl as any ).makeXRCompatible();

  const sesh = new VRSesh( session );
  await sesh.setup();

  return sesh;
}
