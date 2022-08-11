import { Cache } from '../utils/Cache';
import { RawMatrix4, RawQuaternion, RawVector3, mat4Compose, mat4Decompose, mat4LookAt, mat4Multiply } from '@0b5vr/experimental';

export class Transform {
  protected __position: Cache<RawVector3>;
  protected __rotation: Cache<RawQuaternion>;
  protected __scale: Cache<RawVector3>;
  protected __matrix: Cache<RawMatrix4>;

  public get position(): RawVector3 {
    return this.__position.value;
  }

  public set position( vector: RawVector3 ) {
    this.__position.setValue( vector );

    this.__rotation.needsUpdate = false;
    this.__scale.needsUpdate = false;
    this.__matrix.needsUpdate = true;
    this.__isIdentity = false;
  }


  public get rotation(): RawQuaternion {
    return this.__rotation.value;
  }

  public set rotation( quaternion: RawQuaternion ) {
    this.__rotation.setValue( quaternion );

    this.__position.needsUpdate = false;
    this.__scale.needsUpdate = false;
    this.__matrix.needsUpdate = true;
    this.__isIdentity = false;
  }


  public get scale(): RawVector3 {
    return this.__scale.value;
  }

  public set scale( vector: RawVector3 ) {
    this.__scale.setValue( vector );

    this.__position.needsUpdate = false;
    this.__rotation.needsUpdate = false;
    this.__matrix.needsUpdate = true;
    this.__isIdentity = false;
  }

  public get matrix(): RawMatrix4 {
    return this.__matrix.value;
  }

  public set matrix( matrix: RawMatrix4 ) {
    this.__matrix.setValue( matrix );

    this.__position.needsUpdate = true;
    this.__rotation.needsUpdate = true;
    this.__scale.needsUpdate = true;
    this.__isIdentity = false;
  }

  protected __isIdentity: boolean;

  public constructor() {
    this.__position = new Cache( [ 0.0, 0.0, 0.0 ], () => this.__updateTRS().position );
    this.__rotation = new Cache( [ 0.0, 0.0, 0.0, 1.0 ], () => this.__updateTRS().rotation );
    this.__scale = new Cache( [ 1.0, 1.0, 1.0 ], () => this.__updateTRS().scale );

    this.__matrix = new Cache(
      [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
      ],
      () => mat4Compose( this.position, this.rotation, this.scale ),
    );

    this.__isIdentity = true;
  }

  public lookAt( position: RawVector3, target?: RawVector3, roll?: number ): void {
    this.matrix = mat4LookAt( position, target, undefined, roll );
  }

  public multiply( transform: Transform ): Transform {
    if ( transform.__isIdentity ) {
      return this;
    }

    const result = new Transform();
    result.matrix = mat4Multiply( this.matrix, transform.matrix );
    return result;
  }

  private __updateTRS(): { position: RawVector3, rotation: RawQuaternion, scale: RawVector3 } {
    const { position, rotation, scale } = mat4Decompose( this.matrix );
    this.__position.setValue( position );
    this.__rotation.setValue( rotation );
    this.__scale.setValue( scale );
    return { position, rotation, scale };
  }
}
