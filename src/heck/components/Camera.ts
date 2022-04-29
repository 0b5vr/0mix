import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { MaterialTag } from '../Material';
import { RawMatrix4, mat4Inverse } from '@0b5vr/experimental';
import { RenderTarget } from '../RenderTarget';
import { SceneNode } from './SceneNode';
import { Transform } from '../Transform';
import { glClear } from '../../gl/glClear';

export interface CameraOptions extends ComponentOptions {
  renderTarget?: RenderTarget;
  projectionMatrix: RawMatrix4;
  materialTag: MaterialTag;
  exclusionTags?: symbol[];
  scene?: SceneNode;
  clear?: Array<number | undefined> | false;
}

export abstract class Camera extends Component {
  public projectionMatrix: RawMatrix4;

  public renderTarget?: RenderTarget;

  public scene?: SceneNode;

  public exclusionTags: symbol[];

  public clear: Array<number | undefined> | false;

  public materialTag: MaterialTag;

  public abstract get near(): number;

  public abstract get far(): number;

  public constructor( options: CameraOptions ) {
    super( options );

    const { renderTarget, scene, exclusionTags, projectionMatrix, materialTag, clear } = options;

    this.visible = false;

    this.renderTarget = renderTarget;
    this.scene = scene;
    this.exclusionTags = exclusionTags ?? [];
    this.projectionMatrix = projectionMatrix;
    this.materialTag = materialTag;
    this.clear = clear ?? [];
  }

  protected __updateImpl( {
    componentsByTag,
    frameCount,
    globalTransform,
    time,
    path,
  }: ComponentUpdateEvent ): void {
    const { renderTarget, scene, materialTag } = this;

    if ( !renderTarget ) {
      throw import.meta.env.DEV && new Error( 'You must assign a renderTarget to the Camera' );
    }

    if ( !scene ) {
      throw import.meta.env.DEV && new Error( 'You must assign scenes to the Camera' );
    }

    let cameraPath: string | undefined;
    if ( import.meta.env.DEV ) {
      cameraPath = `${ path }/${ this.name }`;
    }

    const viewMatrix = mat4Inverse( globalTransform.matrix );

    renderTarget.bind();

    if ( this.clear ) {
      glClear( ...this.clear );
    }

    scene.draw( {
      frameCount,
      time: time,
      renderTarget,
      cameraTransform: globalTransform,
      globalTransform: new Transform(),
      componentsByTag,
      viewMatrix,
      projectionMatrix: this.projectionMatrix,
      camera: this,
      cameraPath,
      ancestors: [],
      materialTag,
    } );
  }
}
