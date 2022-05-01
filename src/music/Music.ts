import { audio, sampleRate } from '../globals/music';
import { promiseGui } from '../globals/gui';
import { Renderer } from './Renderer';
import { BufferReaderNode } from './BufferReaderNode';
import { shaderchunkPreLines } from './shaderchunks';
import { MUSIC_BPM } from '../config';
import { Xorshift } from '@0b5vr/experimental';

const BEAT = 60.0 / MUSIC_BPM;
const BAR = 240.0 / MUSIC_BPM;
const SIXTEEN_BAR = 3840.0 / MUSIC_BPM;

export const BLOCK_SIZE = 128;
export const BLOCKS_PER_RENDER = 16;
export const FRAMES_PER_RENDER = BLOCK_SIZE * BLOCKS_PER_RENDER;
export const LATENCY_BLOCKS = 32;

interface MusicProgram {
  code: string;
}

interface MusicSampleEntry {
  name: string;
  width: number;
  height: number;
  sampleRate: number;
  duration: number;
}

export class Music {
  public isPlaying: boolean;
  public timeOffset: number;
  public deltaTime: number;

  // private __lastUpdatedTime: number;

  private __musicDest: GainNode;

  private __cueStatus: 'none' | 'compiling' | 'ready' | 'applying' = 'none';

  private __renderer: Renderer;
  private __program?: MusicProgram;
  private __programCue?: MusicProgram;
  private __programSwapTime: number;

  private __prevAudioTime: number;

  private __bufferReaderNode?: BufferReaderNode;
  private __bufferWriteBlocks: number;

  private __samples: Map<string, MusicSampleEntry>;

  public get time(): number {
    return audio.currentTime - this.timeOffset;
  }

  public set time( value: number ) {
    this.timeOffset = audio.currentTime - value;

    const bufferReaderNode = this.__bufferReaderNode;
    if ( bufferReaderNode ) {
      this.__bufferWriteBlocks = bufferReaderNode.readBlocks;
    }
  }

  public constructor() {
    this.isPlaying = false;
    this.timeOffset = 0.0;
    this.deltaTime = 0.0;
    // this.__lastUpdatedTime = 0.0;
    this.__prevAudioTime = 0.0;

    // -- audio ------------------------------------------------------------------------------------
    this.__musicDest = audio.createGain();
    this.__musicDest.connect( audio.destination );

    if ( import.meta.env.DEV ) {
      this.__musicDest.gain.value = 0.0;
      promiseGui.then( ( gui ) => {
        gui.input( 'audio/volume', 0.0, { min: 0.0, max: 1.0 } )?.on( 'change', ( { value } ) => {
          this.__musicDest.gain.value = value;
        } );
      } );
    }

    // -- renderer ---------------------------------------------------------------------------------
    this.__renderer = new Renderer();

    this.__programSwapTime = 0.0;

    // -- reader -----------------------------------------------------------------------------------
    BufferReaderNode.addModule( audio ).then( () => {
      this.__bufferReaderNode = new BufferReaderNode( audio );
      this.__bufferReaderNode.connect( this.__musicDest );
    } );

    this.__bufferWriteBlocks = 0;

    // -- samples ----------------------------------------------------------------------------------
    this.__samples = new Map<string, MusicSampleEntry>();

    // create noise sample
    const width = 2048;
    const height = Math.ceil( sampleRate / width );
    const buffer = new Float32Array( width * height * 4 );
    const rng = new Xorshift();

    for ( let i = 0; i < buffer.length; i ++ ) {
      buffer[ i ] = Math.floor( 1.0 - 2.0 * rng.gen() );
    }

    this.__renderer.uploadTexture( 'noise', width, height, buffer );

    this.__samples.set( 'noise', {
      name: 'noise',
      width: width,
      height,
      duration: 1.0,
      sampleRate: 48000,
    } );
  }

  public halt(): void {
    this.__musicDest.disconnect();
  }

  /**
   * Compile given shader code and cue the shader.
   */
  public async compile( code: string ): Promise<void> {
    this.__setCueStatus( 'compiling' );

    await this.__renderer.compile( code ).catch( ( e ) => {
      const error = this.__processErrorMessage( e );

      this.__programCue = undefined;

      this.__setCueStatus( 'none' );

      // this.__emit( 'error', { error } );

      throw new Error( error ?? undefined );
    } );

    this.__programCue = {
      code,
    };

    this.__setCueStatus( 'ready' );

    // this.__emit( 'error', { error: null } );
  }

  /**
   * Apply the cue shader after the bar ends.
   */
  public applyCue(): void {
    if ( this.__cueStatus === 'ready' ) {
      this.__setCueStatus( 'applying' );

      this.__programSwapTime = Math.floor( this.time / BAR ) * BAR + BAR;
    }
  }

  /**
   * Load a sample and store as a uniform texture.
   */
  public async loadSample( name: string, inputBuffer: ArrayBuffer ): Promise<void> {
    const audioBuffer = await audio.decodeAudioData( inputBuffer );

    const { sampleRate, duration } = audioBuffer;
    const frames = audioBuffer.length;
    const width = 2048;
    const lengthCeiled = Math.ceil( frames / 2048.0 );
    const height = lengthCeiled;

    const buffer = new Float32Array( width * height * 4 );
    const channels = audioBuffer.numberOfChannels;

    const dataL = audioBuffer.getChannelData( 0 );
    const dataR = audioBuffer.getChannelData( channels === 1 ? 0 : 1 );

    for ( let i = 0; i < frames; i ++ ) {
      buffer[ i * 4 + 0 ] = dataL[ i ];
      buffer[ i * 4 + 1 ] = dataR[ i ];
    }

    this.__renderer.uploadTexture( name, width, height, buffer );

    this.__samples.set(
      name,
      {
        name,
        width,
        height,
        sampleRate,
        duration
      }
    );
  }

  public async update(): Promise<void> {
    const now = audio.currentTime;

    if ( this.isPlaying ) {
      this.deltaTime = now - this.__prevAudioTime;
    } else {
      this.deltaTime = 0.0;
    }

    this.__prevAudioTime = now;

    // -- early abort? -----------------------------------------------------------------------------
    if ( !this.isPlaying ) { return; }

    const bufferReaderNode = this.__bufferReaderNode;
    if ( bufferReaderNode == null ) { return; }

    // -- choose a right write block ---------------------------------------------------------------
    const { readBlocks } = bufferReaderNode;

    const blockAhead = this.__bufferWriteBlocks - readBlocks;

    // we don't have to render this time
    if ( blockAhead > LATENCY_BLOCKS ) {
      return;
    }

    // we're very behind
    if ( blockAhead < 0 ) {
      this.__bufferWriteBlocks = (
        Math.floor( readBlocks / BLOCKS_PER_RENDER ) + 1
      ) * BLOCKS_PER_RENDER;
    }

    const genTime = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate;

    // -- should I process the next program? -------------------------------------------------------
    let beginNext = this.__cueStatus === 'applying'
      ? Math.floor( ( this.__programSwapTime - genTime ) * sampleRate )
      : FRAMES_PER_RENDER;
    beginNext = Math.min( beginNext, FRAMES_PER_RENDER );

    // -- swap the program from first --------------------------------------------------------------
    if ( beginNext < 0 ) {
      this.__setCueStatus( 'none' );

      this.__renderer.applyCue();

      this.__program = this.__programCue;
      this.__programCue = undefined;

      beginNext = FRAMES_PER_RENDER;
    }

    // -- render -----------------------------------------------------------------------------------
    if ( this.__program ) {
      await this.__prepareBuffer( 0, beginNext );
    }

    // -- render the next program from the mid of the code -----------------------------------------
    if ( beginNext < FRAMES_PER_RENDER && this.__programCue != null ) {
      this.__setCueStatus( 'none' );

      this.__renderer.applyCue();

      this.__program = this.__programCue;
      this.__programCue = undefined;

      await this.__prepareBuffer( beginNext, FRAMES_PER_RENDER - beginNext );
    }

    // -- update write blocks ----------------------------------------------------------------------
    this.__bufferWriteBlocks += BLOCKS_PER_RENDER;

    // emit an event
    // this.__emit( 'update' );
  }

  private async __prepareBuffer(
    first: number,
    count: number
  ): Promise<void> {
    const bufferReaderNode = this.__bufferReaderNode;
    if ( bufferReaderNode == null ) { return; }

    const glslTime = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate - this.timeOffset;

    // render
    let textureUnit = 0;
    this.__samples.forEach( ( sample ) => {
      this.__renderer.uniformTexture( 'sample_' + sample.name, sample.name, textureUnit );
      textureUnit ++;

      this.__renderer.uniform4f(
        'sample_' + sample.name + '_meta',
        sample.width,
        sample.height,
        sample.sampleRate,
        sample.duration
      );
    } );

    this.__renderer.uniform1f( 'bpm', MUSIC_BPM );
    this.__renderer.uniform1f( '_deltaSample', 1.0 / sampleRate );
    this.__renderer.uniform4f(
      'timeLength',
      BEAT,
      BAR,
      SIXTEEN_BAR,
      1E16
    );
    this.__renderer.uniform4f(
      '_timeHead',
      glslTime % BEAT,
      glslTime % BAR,
      glslTime % SIXTEEN_BAR,
      glslTime
    );

    const [ outL, outR ] = await this.__renderer.render( first, count );

    bufferReaderNode.write(
      0,
      this.__bufferWriteBlocks,
      first,
      outL.subarray( first, first + count ),
    );

    bufferReaderNode.write(
      1,
      this.__bufferWriteBlocks,
      first,
      outR.subarray( first, first + count ),
    );
  }

  private __setCueStatus( cueStatus: 'none' | 'compiling' | 'ready' | 'applying' ): void {
    this.__cueStatus = cueStatus;
    // this.__emit( 'changeCueStatus', { cueStatus } );
  }

  private __processErrorMessage( error: any ): string | null {
    const str: string | undefined = error?.message ?? error;
    if ( !str ) { return null; }

    return str.replace( /ERROR: (\d+):(\d+)/g, ( _match, ...args ) => {
      const line = parseInt( args[ 1 ] ) - shaderchunkPreLines + 1;
      return `ERROR: ${ args[ 0 ] }:${ line }`;
    } );
  }
}
