import { gl } from '../globals/canvas';

export function glWaitGPUCommandsCompleteAsync(): Promise<void> {
  const sync = gl.fenceSync( gl.SYNC_GPU_COMMANDS_COMPLETE, 0 )!;

  return new Promise( ( resolve, reject ) => {
    const test = (): void => {
      const res = gl.clientWaitSync( sync, 0, 0 );
      if ( res === gl.WAIT_FAILED ) {
        reject();
        return;
      }
      if ( res === gl.TIMEOUT_EXPIRED ) {
        setTimeout( test, 10 );
        return;
      }
      gl.deleteSync( sync );
      resolve();
    };

    test();
  } );
}
