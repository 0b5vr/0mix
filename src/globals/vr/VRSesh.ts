import { FAR, NEAR } from '../../config';
import { RawMatrix4 } from '@0b5vr/experimental';
import { gl } from '../canvas';
import type { XRFrame, XRReferenceSpace, XRRigidTransform, XRSession, XRWebGLLayer } from 'webxr';

export class VRSesh {
  public isReady: boolean;
  public session?: XRSession | null;
  public glBaseLayer?: XRWebGLLayer | null;
  public referenceSpace?: XRReferenceSpace | null;
  public onFrame?: ( views: {
    transform: XRRigidTransform,
    projectionMatrix: RawMatrix4,
    viewport: [ number, number, number, number ],
  }[] ) => void;

  public constructor( session: XRSession ) {
    this.session = session;
    this.isReady = false;
    this.session.addEventListener( 'end', () => { this.__dispose(); } );
  }

  public async setup(): Promise<void> {
    if ( this.session == null ) { return; }

    this.glBaseLayer = new ( window as any ).XRWebGLLayer( this.session, gl ) as XRWebGLLayer;

    this.session.updateRenderState( {
      baseLayer: this.glBaseLayer,
      depthNear: NEAR,
      depthFar: FAR,
    } );

    // ????: local-floor
    this.referenceSpace = await this.session.requestReferenceSpace( 'local-floor' );

    this.isReady = true;

    this.session.requestAnimationFrame( ( t, frame ) => this.handleFrame( t, frame ) );
  }

  public handleFrame( _time: number, frame: XRFrame ): void {
    if ( !this.isReady ) { return; }

    const pose = frame.getViewerPose( this.referenceSpace! );

    this.onFrame?.( pose?.views.map( ( view ) => {
      const projectionMatrix = Array.from( view.projectionMatrix ) as RawMatrix4; // is this column-major?
      const viewport = this.glBaseLayer!.getViewport( view );

      return {
        projectionMatrix,
        transform: view.transform,
        viewport: [ viewport.x, viewport.y, viewport.width, viewport.height ],
      };
    } ) ?? [] );

    this.session!.requestAnimationFrame( ( time, frame ) => this.handleFrame( time, frame ) );
  }

  private __dispose(): void {
    this.session = null;
    this.referenceSpace = null;
    this.isReady = false;
  }
}
