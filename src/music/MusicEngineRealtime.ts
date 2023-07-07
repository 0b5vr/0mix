import { BLOCKS_PER_RENDER, BLOCK_SIZE, FRAMES_PER_RENDER, LATENCY_BLOCKS } from './constants';
import { BufferReaderNode } from './BufferReaderNode';
import { GL_ARRAY_BUFFER } from '../gl/constants';
import { MusicEngine } from './MusicEngine';
import { arraySerial } from '@0b5vr/experimental';
import { audio, sampleRate } from '../globals/audio';
import { createDebounce } from '../utils/createDebounce';
import { gl } from '../globals/canvas';
import { glWaitGPUCommandsCompleteAsync } from '../gl/glWaitGPUCommandsCompleteAsync';
import { glslMusicEditor } from '../globals/glslMusicEditor';
import { musicCompile, musicRender, tfPool } from './Renderer';
import { musicRendererStatusObservers } from '../globals/globalObservers';

const debounceShaderApply = createDebounce();

// == dst arrays ===================================================================================
const dstArrayL = new Float32Array( FRAMES_PER_RENDER );
const dstArrayR = new Float32Array( FRAMES_PER_RENDER );

// == music realtime ===============================================================================
export class MusicEngineRealtime implements MusicEngine {
  public isPlaying: boolean;
  public timeOffset: number;
  public deltaTime: number;
  public gainNode: GainNode;

  public cueStatus: 'none' | 'compiling' | 'applying';

  // private __lastUpdatedTime: number;

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

    // -- status -----------------------------------------------------------------------------------
    this.cueStatus = 'none';

    musicRendererStatusObservers.push( ( status ) => this.cueStatus = status );

    // -- shaderEventManager -----------------------------------------------------------------------
    glslMusicEditor.observersApply.push( () => {
      const code = glslMusicEditor.lines.join( '\n' );
      debounceShaderApply( () => musicCompile( code ) );
    } );

    // -- audio ------------------------------------------------------------------------------------
    this.gainNode = audio.createGain();

    // -- reader -----------------------------------------------------------------------------------
    BufferReaderNode.addModule( audio ).then( () => {
      this.__bufferReaderNode = new BufferReaderNode( audio );
      this.__bufferReaderNode.connect( this.gainNode );
      this.__bufferReaderNode.setActive( this.isPlaying );
    } );

    this.__bufferWriteBlocks = 0;
  }

  public play(): void {
    this.isPlaying = true;
    this.__bufferReaderNode?.setActive( true );
  }

  public pause(): void {
    this.isPlaying = false;
    this.__bufferReaderNode?.setActive( false );
  }

  public update(): void {
    const readBlocks = this.__bufferReadBlocks;
    const now = readBlocks * BLOCK_SIZE / sampleRate;

    // process 15 events at max
    arraySerial( 15 ).map( () => glslMusicEditor.update( now - this.timeOffset ) );

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

    const time = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate - this.timeOffset;

    // -- render -----------------------------------------------------------------------------------
    const tfEntry = tfPool.next();

    musicRender( tfEntry, time );

    // -- read the rendered buffer -----------------------------------------------------------------
    const BufferReaderNode = this.__bufferReaderNode;

    if ( BufferReaderNode ) {
      const bufferWriteBlocks = this.__bufferWriteBlocks;

      glWaitGPUCommandsCompleteAsync().then( () => {
        gl.bindBuffer( GL_ARRAY_BUFFER, tfEntry.bufferL );
        gl.getBufferSubData(
          GL_ARRAY_BUFFER,
          0,
          dstArrayL,
        );
        BufferReaderNode.write(
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
        );
        BufferReaderNode.write(
          1,
          bufferWriteBlocks,
          0,
          dstArrayR.subarray( 0, FRAMES_PER_RENDER ),
        );
      } );
    }

    this.__bufferWriteBlocks += BLOCKS_PER_RENDER;
  }
}
