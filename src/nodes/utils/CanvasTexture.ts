import { GL_CLAMP_TO_EDGE, GL_LINEAR } from '../../gl/constants';
import { glSetTextureFromBitmap } from '../../gl/glSetTextureFromBitmap';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { glTextureWrap } from '../../gl/glTextureWrap';
import { gl } from '../../globals/canvas';

export class CanvasTexture {
  public width: number;
  public height: number;
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public texture: WebGLTexture;

  public constructor( width: number, height: number ) {
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;

    this.context = this.canvas.getContext( '2d' )!;

    this.texture = gl.createTexture()!;
    glTextureFilter( this.texture, GL_LINEAR );
    glTextureWrap( this.texture, GL_CLAMP_TO_EDGE );
  }

  public clear(): void {
    this.context.clearRect( 0, 0, this.width, this.height );
  }

  public updateTexture(): void {
    glSetTextureFromBitmap( this.texture, this.canvas );
  }
}
