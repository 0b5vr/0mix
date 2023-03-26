import { BufferReaderNode } from './BufferReaderNode';
import { GL_ARRAY_BUFFER, GL_FLOAT, GL_POINTS, GL_RASTERIZER_DISCARD, GL_STATIC_DRAW, GL_STREAM_READ, GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '../gl/constants';
import { MUSIC_BPM } from '../config';
import { Pool, arraySerial } from '@0b5vr/experimental';
import { audio, sampleRate } from '../globals/audio';
import { createDebounce } from '../utils/createDebounce';
import { gl } from '../globals/canvas';
import { glLazyProgram } from '../gl/glLazyProgram';
import { glWaitGPUCommandsCompleteAsync } from '../gl/glWaitGPUCommandsCompleteAsync';
import { glslMusicEditorLines, updateGLSLMusicEditor } from './glslMusicEditor';
import { promiseGui } from '../globals/gui';
import { shaderEventApplyObservers } from '../globals/globalObservers';
import { shaderchunkPost, shaderchunkPre, shaderchunkPreLines } from './shaderchunks';

const BEAT = 60.0 / MUSIC_BPM;
const BAR = 240.0 / MUSIC_BPM;
const SIXTEEN_BAR = 3840.0 / MUSIC_BPM;

export const BLOCK_SIZE = 128;
export const BLOCKS_PER_RENDER = 32;
export const FRAMES_PER_RENDER = BLOCK_SIZE * BLOCKS_PER_RENDER;
export const LATENCY_BLOCKS = 64;

const debounceShaderApply = createDebounce();

// == dst arrays ===================================================================================
const dstArrayL = new Float32Array( FRAMES_PER_RENDER );
const dstArrayR = new Float32Array( FRAMES_PER_RENDER );

// == offset buffer ================================================================================
const offsetBuffer = gl.createBuffer();

gl.bindBuffer( GL_ARRAY_BUFFER, offsetBuffer );
gl.bufferData(
  GL_ARRAY_BUFFER,
  dstArrayL.map( ( _, i ) => i ),
  GL_STATIC_DRAW,
);
gl.bindBuffer( GL_ARRAY_BUFFER, null );

// == transform feedback pool ======================================================================
interface TFPoolEntry {
  bufferL: WebGLBuffer;
  bufferR: WebGLBuffer;
  tf: WebGLTransformFeedback;
}

const tfPool = new Pool<TFPoolEntry>( arraySerial( 128 ).map( () => {
  const bufferL = gl.createBuffer()!;

  gl.bindBuffer( GL_ARRAY_BUFFER, bufferL );
  gl.bufferData(
    GL_ARRAY_BUFFER,
    FRAMES_PER_RENDER * 4 /* Float32Array.BYTES_PER_ELEMENT */,
    GL_STREAM_READ,
  );
  gl.bindBuffer( GL_ARRAY_BUFFER, null );

  const bufferR = gl.createBuffer()!;

  gl.bindBuffer( GL_ARRAY_BUFFER, bufferR );
  gl.bufferData(
    GL_ARRAY_BUFFER,
    FRAMES_PER_RENDER * 4 /* Float32Array.BYTES_PER_ELEMENT */,
    GL_STREAM_READ,
  );
  gl.bindBuffer( GL_ARRAY_BUFFER, null );

  const tf = gl.createTransformFeedback()!;

  return { bufferL, bufferR, tf };
} ) );

// == process error ================================================================================
function processErrorMessage( error: any ): string | null {
  const str: string | undefined = error?.message ?? error;
  if ( !str ) { return null; }

  return str.replace( /ERROR: (\d+):(\d+)/g, ( _match, ...args ) => {
    const line = parseInt( args[ 1 ] ) - shaderchunkPreLines + 1;
    return `ERROR: ${ args[ 0 ] }:${ line }`;
  } );
}

export class Music {
  public isPlaying: boolean;
  public timeOffset: number;
  public deltaTime: number;

  public cueStatus: 'none' | 'compiling' | 'applying' = 'none';

  // private __lastUpdatedTime: number;

  private __program?: WebGLProgram;
  private __programCue?: WebGLProgram;
  private __programSwapTime: number;

  private __prevTime: number;

  private __bufferReaderNode?: BufferReaderNode;
  private __bufferWriteBlocks: number;

  public get time(): number {
    const t = BLOCK_SIZE / sampleRate * this.__bufferReadBlocks;
    return t - this.timeOffset;
  }

  public set time( value: number ) {
    const t = BLOCK_SIZE / sampleRate * this.__bufferReadBlocks;
    this.timeOffset = t - value;
  }

  private get __bufferReadBlocks(): number {
    return this.__bufferReaderNode?.readBlocks ?? 0.0;
  }

  public constructor() {
    this.isPlaying = false;
    this.timeOffset = 0.0;
    this.deltaTime = 0.0;
    this.__prevTime = 0.0;

    // -- shaderEventManager -----------------------------------------------------------------------
    shaderEventApplyObservers.push( () => {
      const code = glslMusicEditorLines.join( '\n' );
      debounceShaderApply( () => this.compile( code ) );
    } );

    // -- audio ------------------------------------------------------------------------------------
    const gainNode = audio.createGain();
    gainNode.connect( audio.destination );

    if ( import.meta.env.DEV ) {
      gainNode.gain.value = 0.0;
      promiseGui.then( ( gui ) => {
        gui.button( 'audio/resume', { title: 'audio.resume();' } ).on( 'click', () => {
          audio.resume();
        } );

        gui.input( 'audio/volume', 0.0, { min: 0.0, max: 1.0 } )?.on( 'change', ( { value } ) => {
          gainNode.gain.value = value;
        } );
      } );
    }

    // -- program ----------------------------------------------------------------------------------
    this.__programSwapTime = 0.0;

    // -- reader -----------------------------------------------------------------------------------
    BufferReaderNode.addModule( audio ).then( () => {
      this.__bufferReaderNode = new BufferReaderNode( audio );
      this.__bufferReaderNode.connect( gainNode );
    } );

    this.__bufferWriteBlocks = 0;
  }

  /**
   * Compile given shader code and cue the shader.
   */
  public async compile( code: string ): Promise<void> {
    this.cueStatus = 'compiling';

    const promiseProgramCue = glLazyProgram(
      shaderchunkPre + code + shaderchunkPost,
      '#version 300 es\nvoid main(){discard;}',
      {
        tfVaryings: [ 'outL', 'outR' ],
      },
    );

    if ( import.meta.env.DEV ) {
      promiseProgramCue.catch( ( e ) => {
        const error = processErrorMessage( e );
        this.__programCue = undefined;
        this.cueStatus = 'none';
        throw new Error( error ?? undefined );
      } );
    }

    this.__programCue = await promiseProgramCue;
    this.cueStatus = 'applying';
    this.__programSwapTime = ~~( this.time / BAR ) * BAR + BAR;
  }

  public async update(): Promise<void> {
    const readBlocks = this.__bufferReadBlocks;
    const now = readBlocks * BLOCK_SIZE / sampleRate;

    this.__bufferReaderNode?.setActive( this.isPlaying );

    updateGLSLMusicEditor( now - this.timeOffset );

    if ( import.meta.env.DEV ) {
      // process 15 more events if it's dev mode
      arraySerial( 15 ).map( () => updateGLSLMusicEditor( now - this.timeOffset ) );
    }

    if ( this.isPlaying ) {
      this.deltaTime = now - this.__prevTime;
    } else {
      this.deltaTime = 0.0;
    }

    this.__prevTime = now;

    // -- early abort? -----------------------------------------------------------------------------
    if ( !this.isPlaying ) { return; }

    // -- should we render this time? --------------------------------------------------------------
    const blockAhead = this.__bufferWriteBlocks - readBlocks;

    // we don't have to render this time
    if ( blockAhead > LATENCY_BLOCKS ) {
      return;
    }

    // -- choose a right write block ---------------------------------------------------------------
    // we're very behind
    if ( blockAhead < 0 ) {
      this.__bufferWriteBlocks = (
        ~~( readBlocks / BLOCKS_PER_RENDER ) + 1
      ) * BLOCKS_PER_RENDER;
    }

    const genTime = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate - this.timeOffset;

    // -- should I process the next program? -------------------------------------------------------
    let beginNext = this.cueStatus === 'applying'
      ? ~~( ( this.__programSwapTime - genTime ) * sampleRate )
      : FRAMES_PER_RENDER;
    beginNext = Math.min( beginNext, FRAMES_PER_RENDER );

    // -- swap the program from first --------------------------------------------------------------
    if ( beginNext < 0 ) {
      this.cueStatus = 'none';
      this.__applyCue();
      beginNext = FRAMES_PER_RENDER;
    }

    // -- render -----------------------------------------------------------------------------------
    const tfEntry = tfPool.next();

    this.__render( tfEntry, 0, beginNext );

    // render the next program from the mid of the code
    if ( beginNext < FRAMES_PER_RENDER && this.__programCue ) {
      this.cueStatus = 'none';
      this.__applyCue();
      this.__render( tfEntry, beginNext, FRAMES_PER_RENDER - beginNext );
    }

    // -- read the rendered buffer -----------------------------------------------------------------
    this.__readBuffer( tfEntry );
    this.__bufferWriteBlocks += BLOCKS_PER_RENDER;
  }

  private __applyCue(): void {
    this.__program && gl.deleteProgram( this.__program );
    this.__program = this.__programCue;
  }

  private __render( tfEntry: TFPoolEntry, first: number, count: number ): void {
    if ( this.__program ) {
      const glslTime = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate - this.timeOffset;

      gl.useProgram( this.__program );

      // -- uniforms -------------------------------------------------------------------------------
      gl.uniform1f(
        gl.getUniformLocation( this.__program, 'bpm' ),
        MUSIC_BPM,
      );
      gl.uniform1f(
        gl.getUniformLocation( this.__program, 'sampleRate' ),
        sampleRate,
      );
      gl.uniform4f(
        gl.getUniformLocation( this.__program, 'timeLength' ),
        BEAT,
        BAR,
        SIXTEEN_BAR,
        1E16
      );
      gl.uniform4f(
        gl.getUniformLocation( this.__program, 'timeHead' ),
        glslTime % BEAT,
        glslTime % BAR,
        ( glslTime - BAR ) % SIXTEEN_BAR,
        glslTime
      );

      // -- attributes -----------------------------------------------------------------------------
      const attribLocation = gl.getAttribLocation( this.__program, 'off' );

      gl.bindBuffer( GL_ARRAY_BUFFER, offsetBuffer );
      gl.enableVertexAttribArray( attribLocation );
      gl.vertexAttribPointer( attribLocation, 1, GL_FLOAT, false, 0, 0 );

      // -- render ---------------------------------------------------------------------------------
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, tfEntry.tf );
      gl.bindBufferRange( GL_TRANSFORM_FEEDBACK_BUFFER, 0, tfEntry.bufferL, 4 * first, 4 * count );
      gl.bindBufferRange( GL_TRANSFORM_FEEDBACK_BUFFER, 1, tfEntry.bufferR, 4 * first, 4 * count );
      gl.enable( GL_RASTERIZER_DISCARD );

      gl.beginTransformFeedback( GL_POINTS );
      gl.drawArrays( GL_POINTS, first, count );
      gl.endTransformFeedback();

      gl.disable( GL_RASTERIZER_DISCARD );
      gl.bindTransformFeedback( GL_TRANSFORM_FEEDBACK, null );
    }
  }

  private async __readBuffer( tfEntry: TFPoolEntry ): Promise<void> {
    if ( this.__bufferReaderNode ) {
      const bufferWriteBlocks = this.__bufferWriteBlocks;

      await glWaitGPUCommandsCompleteAsync();

      gl.bindBuffer( GL_ARRAY_BUFFER, tfEntry.bufferL );
      gl.getBufferSubData(
        GL_ARRAY_BUFFER,
        0,
        dstArrayL,
        0,
        FRAMES_PER_RENDER,
      );
      this.__bufferReaderNode.write(
        0,
        bufferWriteBlocks,
        0,
        dstArrayL.subarray( 0, FRAMES_PER_RENDER ),
      );

      gl.bindBuffer( GL_ARRAY_BUFFER, tfEntry.bufferR );
      gl.getBufferSubData(
        GL_ARRAY_BUFFER,
        0,
        dstArrayR,
        0,
        FRAMES_PER_RENDER,
      );
      this.__bufferReaderNode.write(
        1,
        bufferWriteBlocks,
        0,
        dstArrayR.subarray( 0, FRAMES_PER_RENDER ),
      );
    }
  }
}
