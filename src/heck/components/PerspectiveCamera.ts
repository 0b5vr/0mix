import { Camera } from './Camera';
import { ComponentOptions } from './Component';
import { MaterialTag } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { SceneNode } from './SceneNode';
import { mat4Perspective } from '@0b5vr/experimental';

export interface PerspectiveCameraOptions extends ComponentOptions {
  materialTag: MaterialTag;
  renderTarget?: RenderTarget;
  near?: number;
  far?: number;
  fov?: number;
  scene?: SceneNode;
  exclusionTags?: symbol[];
  clear?: Array<number | undefined> | false;
}

export class PerspectiveCamera extends Camera {
  public get fov(): number {
    return this.__fov;
  }
  public set fov( value: number ) {
    this.__fov = value;
    this.__updatePerspectiveCamera();
  }
  private __fov: number;

  public get near(): number {
    return this.__near;
  }
  public set near( value: number ) {
    this.__near = value;
    this.__updatePerspectiveCamera();
  }
  private __near: number;

  public get far(): number {
    return this.__far;
  }
  public set far( value: number ) {
    this.__far = value;
    this.__updatePerspectiveCamera();
  }
  private __far: number;

  public constructor( options: PerspectiveCameraOptions ) {
    const fov = options.fov ?? 45.0;
    const near = options.near ?? 0.01;
    const far = options.far ?? 100.0;

    const projectionMatrix = mat4Perspective( fov, near, far );

    super( {
      ...options,
      projectionMatrix,
    } );

    this.__fov = fov;
    this.__near = near;
    this.__far = far;
  }

  protected __updatePerspectiveCamera(): void {
    this.projectionMatrix = mat4Perspective( this.fov, this.near, this.far );
  }
}
