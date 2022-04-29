import { glLazyProgram } from '../gl/glLazyProgram';
import { gl } from '../globals/canvas';
import { FRAMES_PER_RENDER } from './Music';
import { shaderchunkPost, shaderchunkPre } from './shaderchunks';

export class Renderer {
  public readonly __extParallel: any;

  private __offsetBuffer: WebGLBuffer;
  private __tfBuffers: [ WebGLBuffer, WebGLBuffer ];
  private __transformFeedback: WebGLTransformFeedback;

  private __program: WebGLProgram | null;
  private __programCue: WebGLProgram | null;

  private __textures: Map<string, WebGLTexture>;

  private __dstArrays: [ Float32Array, Float32Array ];

  public constructor() {
    this.__extParallel = gl.getExtension( 'KHR_parallel_shader_compile' );

    this.__offsetBuffer = this.__createOffsetBuffer();
    this.__tfBuffers = [
      this.__createTFBuffer(),
      this.__createTFBuffer(),
    ];
    this.__transformFeedback = this.__createTransformFeedback( this.__tfBuffers );

    this.__dstArrays = [
      new Float32Array( FRAMES_PER_RENDER ),
      new Float32Array( FRAMES_PER_RENDER ),
    ];

    this.__program = null;
    this.__programCue = null;

    this.__textures = new Map();
  }

  /**
   * Dispose the renderer.
   */
  public dispose(): void {
    gl.deleteBuffer( this.__offsetBuffer );
    gl.deleteBuffer( this.__tfBuffers[ 0 ] );
    gl.deleteBuffer( this.__tfBuffers[ 1 ] );

    gl.deleteTransformFeedback( this.__transformFeedback );

    gl.deleteProgram( this.__program );
    gl.deleteProgram( this.__programCue );

    this.__textures.forEach( ( texture ) => {
      gl.deleteTexture( texture );
    } );
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
   * Create a texture and upload data.
   */
  public uploadTexture(
    textureName: string,
    width: number,
    height: number,
    source: Float32Array,
  ): void {
    const texture = gl.createTexture()!;

    gl.bindTexture( gl.TEXTURE_2D, texture );

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      source,
    );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );

    gl.bindTexture( gl.TEXTURE_2D, null );

    this.__textures.set( textureName, texture );
  }

  /**
   * Delete a texture entry.
   */
  public deleteTexture( textureName: string ): void {
    const texture = this.__textures.get( textureName );
    if ( texture == null ) { return; }

    gl.deleteTexture( texture );
    this.__textures.delete( textureName );
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
   * Set a texture uniform to the current program.
   */
  public uniformTexture( name: string, textureName: string, unit: number ): void {
    const { __program: program } = this;
    if ( program == null ) { return; }

    const texture = this.__textures.get( textureName );
    if ( texture == null ) { return; }

    const location = gl.getUniformLocation( program, name );

    gl.activeTexture( gl.TEXTURE0 + unit );
    gl.bindTexture( gl.TEXTURE_2D, texture );

    gl.useProgram( program );
    gl.uniform1i( location, unit );
    gl.useProgram( null );
  }

  /**
   * Render and return a buffer.
   */
  public async render( first: number, count: number ): Promise<[ Float32Array, Float32Array ]> {
    const { __program: program } = this;
    if ( program == null ) {
      return this.__dstArrays;
    }

    // attrib
    const attribLocation = gl.getAttribLocation( program, 'off' );

    gl.bindBuffer( gl.ARRAY_BUFFER, this.__offsetBuffer );
    gl.enableVertexAttribArray( attribLocation );
    gl.vertexAttribPointer( attribLocation, 1, gl.FLOAT, false, 0, 0 );

    // render
    gl.useProgram( program );
    gl.bindTransformFeedback( gl.TRANSFORM_FEEDBACK, this.__transformFeedback );
    gl.enable( gl.RASTERIZER_DISCARD );

    gl.beginTransformFeedback( gl.POINTS );
    gl.drawArrays( gl.POINTS, first, count );
    gl.endTransformFeedback();

    gl.disable( gl.RASTERIZER_DISCARD );
    gl.bindTransformFeedback( gl.TRANSFORM_FEEDBACK, null );
    gl.useProgram( null );

    // feedback
    gl.bindBuffer( gl.ARRAY_BUFFER, this.__tfBuffers[ 0 ] );
    gl.getBufferSubData(
      gl.ARRAY_BUFFER,
      0,
      this.__dstArrays[ 0 ],
      first,
      count,
    );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );

    gl.bindBuffer( gl.ARRAY_BUFFER, this.__tfBuffers[ 1 ] );
    gl.getBufferSubData(
      gl.ARRAY_BUFFER,
      0,
      this.__dstArrays[ 1 ],
      first,
      count,
    );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );

    return this.__dstArrays;
  }

  private __createOffsetBuffer(): WebGLBuffer {
    const array = new Float32Array( FRAMES_PER_RENDER )
      .map( ( _, i ) => i );

    const buffer = gl.createBuffer()!;

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.bufferData( gl.ARRAY_BUFFER, array, gl.STATIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );

    return buffer;
  }

  private __createTFBuffer(): WebGLBuffer {
    const buffer = gl.createBuffer()!;

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.bufferData(
      gl.ARRAY_BUFFER,
      FRAMES_PER_RENDER * 4 /* Float32Array.BYTES_PER_ELEMENT */,
      gl.DYNAMIC_COPY,
    );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );

    return buffer;
  }

  private __createTransformFeedback(
    tfBuffers: [ WebGLBuffer, WebGLBuffer ]
  ): WebGLTransformFeedback {
    const tf = gl.createTransformFeedback()!;

    gl.bindTransformFeedback( gl.TRANSFORM_FEEDBACK, tf );
    gl.bindBufferBase( gl.TRANSFORM_FEEDBACK_BUFFER, 0, tfBuffers[ 0 ] );
    gl.bindBufferBase( gl.TRANSFORM_FEEDBACK_BUFFER, 1, tfBuffers[ 1 ] );
    gl.bindTransformFeedback( gl.TRANSFORM_FEEDBACK, null );

    return tf;
  }
}
