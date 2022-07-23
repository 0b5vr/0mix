import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';
import { canvas } from '../../globals/canvas';
import { downloadBlob } from '../../utils/downloadBlob';
import { promiseGui } from '../../globals/gui';

export class Capture extends SceneNode {
  public constructor() {
    super();

    promiseGui.then( ( gui ) => {
      let queueCapture = false;

      gui.button( 'Capture/screenshot' ).on( 'click', () => {
        queueCapture = true;
      } );

      const stream = canvas.captureStream( 60 );

      let currentRecorder: MediaRecorder | null = null;

      gui.button( 'Capture/record' ).on( 'click', () => {
        if ( currentRecorder ) {
          // stop
          currentRecorder.stop();
          currentRecorder = null;
        } else {
          // start
          currentRecorder = new MediaRecorder( stream, {
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: 6_000_000,
          } );

          currentRecorder.addEventListener( 'dataavailable', ( event ) => {
            if ( event.data.size > 0 ) {
              const blob = new Blob( [ event.data ], { type: 'video/webm' } );
              downloadBlob( blob, 'capture.webm' );
            }
          } );

          currentRecorder.start();
        }
      } );

      const lambdaUpdateStatus = new Lambda( {
        onUpdate() {
          ( stream.getTracks()[ 0 ] as CanvasCaptureMediaStreamTrack ).requestFrame();

          if ( queueCapture ) {
            canvas.toBlob( ( blob ) => {
              downloadBlob( blob!, 'screenshot.png' );
            }, 'image/png' );

            queueCapture = false;
          }

          const text = currentRecorder ? 'Recording' : 'Ready';
          gui.monitor( 'Capture/status', text );
        },
      } );
      this.children.push( lambdaUpdateStatus );
    } );
  }
}
