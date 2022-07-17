import { GL_BYTE, GL_FLOAT, GL_HALF_FLOAT, GL_INT, GL_SHORT, GL_TRANSFORM_FEEDBACK, GL_TRIANGLES, GL_UNSIGNED_BYTE, GL_UNSIGNED_INT, GL_UNSIGNED_SHORT } from '../gl/constants';
import { GLDrawMode } from '../gl/glDrawMode';
import { GLIndexType } from '../gl/GLIndexType';
import { gl } from '../globals/canvas';

export class Geometry {
  public static typeSizeMap: { [ type: number ]: number } = {
    [ GL_BYTE ]: 1,
    [ GL_UNSIGNED_BYTE ]: 1,
    [ GL_SHORT ]: 2,
    [ GL_UNSIGNED_SHORT ]: 2,
    [ GL_INT ]: 4,
    [ GL_UNSIGNED_INT ]: 4,
    [ GL_HALF_FLOAT ]: 2,
    [ GL_FLOAT ]: 4,
  };

  public transformFeedback?: WebGLTransformFeedback | null;

  public mode: GLDrawMode = GL_TRIANGLES;
  public first = 0;
  public count = 0;
  public indexType: GLIndexType | null = null; // null to not use index buffer
  public primcount: number | null = null; // null to not use instancing

  public vao: WebGLVertexArrayObject;

  public constructor() {
    this.vao = gl.createVertexArray()!;
  }

  public draw(): void {
    if ( import.meta.env.DEV ) {
      if ( this.count === 0 ) {
        console.warn( 'You attempt to draw a geometry that count is 0' );
        return;
      }
    }

    if ( this.transformFeedback ) {
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, this.transformFeedback );
      gl.beginTransformFeedback( this.mode );
      this.drawElementsOrArrays();
      gl.endTransformFeedback();
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, null );
    } else {
      this.drawElementsOrArrays();
    }
  }

  public drawElementsOrArrays(): void {
    gl.bindVertexArray( this.vao );

    if ( this.primcount != null ) {
      if ( this.indexType != null ) {
        gl.drawElementsInstanced(
          this.mode,
          this.count,
          this.indexType!,
          this.first * Geometry.typeSizeMap[ this.indexType! ],
          this.primcount!,
        );
      } else {
        gl.drawArraysInstanced( this.mode, this.first, this.count, this.primcount! );
      }
    } else {
      if ( this.indexType != null ) {
        gl.drawElements(
          this.mode,
          this.count,
          this.indexType!,
          this.first * Geometry.typeSizeMap[ this.indexType! ],
        );
      } else {
        gl.drawArrays( this.mode, this.first, this.count );
      }
    }

    gl.bindVertexArray( null );
  }

  public disposeBuffers(): void {
    if ( import.meta.env.DEV ) {
      throw new Error( 'Not Implemented' );
    }
  }
}
