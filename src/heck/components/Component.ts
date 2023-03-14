import { Camera } from './Camera';
import { MapOfSet } from '../../utils/MapOfSet';
import { MaterialTag } from '../Material';
import { RawMatrix4, notifyObservers } from '@0b5vr/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { ancestorsToPath } from '../utils/ancestorsToPath';
import { arraySetIntersects } from '../../utils/arraySetIntersects';
import { componentUpdateObservers } from '../../globals/globalObservers';
import { gui, guiMeasureDraw, guiMeasureUpdate } from '../../globals/gui';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  ancestors: Component[];
  componentsByTag: MapOfSet<symbol, Component>;
}

export interface ComponentDrawEvent {
  frameCount: number;
  time: number;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  target: RenderTarget;
  globalTransform: Transform;
  viewMatrix: RawMatrix4;
  projectionMatrix: RawMatrix4;
  ancestors: Component[];
  componentsByTag: MapOfSet<symbol, Component>;
  cameraAncestors: Component[];
}

export interface ComponentOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  tags?: symbol[];
  ignoreBreakpoints?: boolean;
}

export class Component {
  public static updateHaveReachedBreakpoint = false;
  public static drawHaveReachedBreakpoint = false;

  public lastUpdateFrame: number;

  public active: boolean;
  public visible: boolean;

  public tags: symbol[];

  public name?: string;
  public ignoreBreakpoints?: boolean;

  public constructor( options?: ComponentOptions ) {
    this.lastUpdateFrame = 0;

    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    this.tags = options?.tags ?? [];

    if ( import.meta.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
      this.ignoreBreakpoints = options?.ignoreBreakpoints;
    }
  }

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    this.tags.map( ( tag ) => (
      event.componentsByTag.add( tag, this )
    ) );

    if ( import.meta.env.DEV ) {
      if ( Component.updateHaveReachedBreakpoint && !this.ignoreBreakpoints ) { return; }

      notifyObservers( componentUpdateObservers, {
        ...event,
        ancestors: [ ...event.ancestors, this ],
      } );

      if ( this.name != null ) {
        guiMeasureUpdate( this.name!, () => {
          this.__updateImpl( event );
        } );
      } else {
        this.__updateImpl( event );
      }

      const ha = gui;
      const breakpoint = ha?.value( 'breakpoint/update', '' ) ?? '';
      if ( breakpoint !== '' ) {
        const path = ancestorsToPath( event.ancestors );
        if ( new RegExp( breakpoint ).test( path ) ) {
          Component.updateHaveReachedBreakpoint = true;
        }
      }
    } else {
      this.__updateImpl( event );
    }
  }

  protected __updateImpl( _event: ComponentUpdateEvent ): void { // eslint-disable-line
    // do nothing
  }

  public draw( event: ComponentDrawEvent ): void {
    if ( !this.visible ) { return; }
    if ( arraySetIntersects( event.camera.exclusionTags, this.tags ) ) {
      return;
    }

    if ( import.meta.env.DEV ) {
      if ( Component.drawHaveReachedBreakpoint && !this.ignoreBreakpoints ) { return; }
      const ha = gui;
      const focusName = ha?.value( 'profilers/draw/camera', '' ) ?? '';
      if ( focusName !== '' ) {
        const cameraPath = ancestorsToPath( [ ...event.cameraAncestors, event.camera ] );
        const focus = focusName != null
          && focusName !== ''
          && cameraPath != null
          && cameraPath.includes( focusName );

        if ( this.name != null && focus ) {
          guiMeasureDraw( this.name, () => {
            this.__drawImpl( event );
          } );
        } else {
          this.__drawImpl( event );
        }
      } else {
        this.__drawImpl( event );
      }

      const breakpoint = ha?.value( 'breakpoint/draw', '' ) ?? '';
      if ( breakpoint !== '' ) {
        const path = ancestorsToPath( [ ...event.ancestors, this ] );

        if ( new RegExp( breakpoint ).test( path ) ) {
          Component.drawHaveReachedBreakpoint = true;
        }
      }
    } else {
      this.__drawImpl( event );
    }
  }

  protected __drawImpl( _event: ComponentDrawEvent ): void { // eslint-disable-line
    // do nothing
  }
}
