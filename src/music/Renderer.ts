import { FRAMES_PER_RENDER } from './Music';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_COPY, GL_FLOAT, GL_POINTS, GL_RASTERIZER_DISCARD, GL_STATIC_DRAW, GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '../gl/constants';
import { gl } from '../globals/canvas';
import { glLazyProgram } from '../gl/glLazyProgram';
import { shaderchunkPost, shaderchunkPre } from './shaderchunks';

export class Renderer {
  public readonly __extParallel: any;

  private __offsetBuffer: WebGLBuffer;
  private __tfBuffer0: WebGLBuffer;
  private __tfBuffer1: WebGLBuffer;
  private __tf: WebGLTransformFeedback;

  private __program: WebGLProgram | null;
  private __programCue: WebGLProgram | null;

  private __dstArrays: [ Float32Array, Float32Array ];

  public constructor() {
    this.__extParallel = gl.getExtension( 'KHR_parallel_shader_compile' );

    this.__offsetBuffer = this.__createOffsetBuffer();
    this.__tfBuffer0 = this.__createTFBuffer();
    this.__tfBuffer1 = this.__createTFBuffer();
    this.__tf = this.__createTransformFeedback( this.__tfBuffer0, this.__tfBuffer1 );

    this.__dstArrays = [
      new Float32Array( FRAMES_PER_RENDER ),
      new Float32Array( FRAMES_PER_RENDER ),
    ];

    this.__program = null;
    this.__programCue = null;
  }

  /**
   * Dispose the renderer.
   */
  public dispose(): void {
    gl.deleteBuffer( this.__offsetBuffer );

    gl.deleteBuffer( this.__tfBuffer0 );
    gl.deleteBuffer( this.__tfBuffer1 );
    gl.deleteTransformFeedback( this.__tf );

    gl.deleteProgram( this.__program );
    gl.deleteProgram( this.__programCue );
  }

  /**
   * Compile given shader code and cue the shader.
   */
  public async compile( code: string ): Promise<void> {
    const program = await glLazyProgram(
      shaderchunkPre + code + shaderchunkPost,
      '#version 300 es\nvoid main(){discard;}',
      {
        tfVaryings: [ 'outL', 'outR' ],
      },
    ).catch( ( error: any ) => {
      this.__programCue = null;
      gl.deleteProgram( this.__programCue );

      throw error;
    } );

    if ( program == null ) { return; }

    this.__programCue = program;
  }

  /**
   * Apply the cue shader.
   *
   * It does not do nothing when cue is not set.
   * Feel free to mash this method for no reason.
   */
  public applyCue(): void {
    if ( this.__programCue == null ) { return; }

    const prevProgram = this.__program;
    this.__program = this.__programCue;

    if ( prevProgram != null ) {
      gl.deleteProgram( prevProgram );
    }
    this.__programCue = null;
  }

  /**
   * Set an uniform1f to the current program.
   */
  public uniform1f( name: string, value: number ): void {
    const { __program: program } = this;
    if ( program == null ) { return; }

    const location = gl.getUniformLocation( program, name );

    gl.useProgram( program );
    gl.uniform1f( location, value );
    gl.useProgram( null );
  }

  /**
   * Set an uniform4f to the current program.
   */
  public uniform4f( name: string, ...value: [ number, number, number, number ] ): void {
    const { __program: program } = this;
    if ( program == null ) { return; }

    const location = gl.getUniformLocation( program, name );

    gl.useProgram( program );
    gl.uniform4f( location, ...value );
    gl.useProgram( null );
  }

  /**
   * Render and return a buffer.
   */
  public render( first: number, count: number ): void {
    const { __program: program } = this;
    if ( program ) {
      // attrib
      const attribLocation = gl.getAttribLocation( program, 'off' );

      gl.bindBuffer( GL_ARRAY_BUFFER, this.__offsetBuffer );
      gl.enableVertexAttribArray( attribLocation );
      gl.vertexAttribPointer( attribLocation, 1, GL_FLOAT, false, 0, 0 );

      // render
      gl.useProgram( program );
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, this.__tf );
      gl.enable( GL_RASTERIZER_DISCARD );

      gl.beginTransformFeedback( GL_POINTS );
      gl.drawArrays( GL_POINTS, first, count );
      gl.endTransformFeedback();

      gl.disable( GL_RASTERIZER_DISCARD );
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, null );
      gl.useProgram( null );
    }
  }

  /**
   * Read the previously rendered buffer.
   */
  public readBuffer(): [ Float32Array, Float32Array ] {
    gl.bindBuffer( GL_ARRAY_BUFFER, this.__tfBuffer0 );
    gl.getBufferSubData(
      GL_ARRAY_BUFFER,
      0,
      this.__dstArrays[ 0 ],
      0,
      FRAMES_PER_RENDER,
    );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );

    gl.bindBuffer( GL_ARRAY_BUFFER, this.__tfBuffer1 );
    gl.getBufferSubData(
      GL_ARRAY_BUFFER,
      0,
      this.__dstArrays[ 1 ],
      0,
      FRAMES_PER_RENDER,
    );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );

    return this.__dstArrays;
  }

  private __createOffsetBuffer(): WebGLBuffer {
    const array = new Float32Array( FRAMES_PER_RENDER )
      .map( ( _, i ) => i );

    const buffer = gl.createBuffer()!;

    gl.bindBuffer( GL_ARRAY_BUFFER, buffer );
    gl.bufferData( GL_ARRAY_BUFFER, array, GL_STATIC_DRAW );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );

    return buffer;
  }

  private __createTFBuffer(): WebGLBuffer {
    const buffer = gl.createBuffer()!;

    gl.bindBuffer( GL_ARRAY_BUFFER, buffer );
    gl.bufferData(
      GL_ARRAY_BUFFER,
      FRAMES_PER_RENDER * 4 /* Float32Array.BYTES_PER_ELEMENT */,
      GL_DYNAMIC_COPY,
    );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );

    return buffer;
  }

  private __createTransformFeedback(
    buffer0: WebGLBuffer,
    buffer1: WebGLBuffer,
  ): WebGLTransformFeedback {
    const tf = gl.createTransformFeedback()!;

    gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, tf );
    gl.bindBufferBase( GL_TRANSFORM_FEEDBACK_BUFFER, 0, buffer0 );
    gl.bindBufferBase( GL_TRANSFORM_FEEDBACK_BUFFER, 1, buffer1 );
    gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, null );

    return tf;
  }
}
