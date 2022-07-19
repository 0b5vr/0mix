import { GL_LINEAR, GL_REPEAT } from '../gl/constants';
import { Xorshift } from '@0b5vr/experimental';
import { gl } from '../globals/canvas';
import { glSetTexture } from '../gl/glSetTexture';
import { glTextureFilter } from '../gl/glTextureFilter';
import { glTextureWrap } from '../gl/glTextureWrap';

export class RandomTexture {
  private __texture: WebGLTexture;
  private __array: Uint8Array;
  private __rng: Xorshift;
  private __width: number;
  private __height: number;

  public constructor(
    width: number,
    height: number,
  ) {
    this.__width = width;
    this.__height = height;
    this.__rng = new Xorshift();
    this.__array = new Uint8Array( width * height * 4 );

    const texture = this.__texture = gl.createTexture()!;
    glTextureFilter( texture, GL_LINEAR );
    glTextureWrap( texture, GL_REPEAT );
  }

  public get texture(): WebGLTexture {
    return this.__texture;
  }

  public resize( width: number, height: number, seed?: number ): void {
    this.__width = width;
    this.__height = height;
    this.__array = new Uint8Array( width * height * 4 );

    this.update( seed );
  }

  public update( seed?: number ): void {
    if ( seed ) { this.__rng.seed = seed; }

    for ( let i = 0; i < this.__array.length; i ++ ) {
      this.__array[ i ] = this.__rng.gen() * 256.0;
    }

    glSetTexture( this.__texture, this.__width, this.__height, this.__array );
  }
}
