import { promiseGui } from '../globals/gui';
import { Renderer } from './Renderer';
import { BufferReaderNode } from './BufferReaderNode';
import { shaderchunkPreLines } from './shaderchunks';
import { MUSIC_BPM } from '../config';
import { sample808HiHat } from './samples/sample808HiHat';
import { sampleWhiteNoise } from './samples/sampleWhiteNoise';
import { audio, sampleRate } from '../globals/audio';
import { sampleClapNoise } from './samples/sampleClapNoise';
import { perlinFBMTextureTarget } from '../textures/perlinFBMTextureTarget';
import { ShaderEventManager } from './ShaderEventManager';

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

export class Music {
  public isPlaying: boolean;
  public timeOffset: number;
  public deltaTime: number;

  public shaderEventManager: ShaderEventManager;
  public cueStatus: 'none' | 'compiling' | 'applying' = 'none';

  // private __lastUpdatedTime: number;

  private __musicDest: GainNode;

  private __renderer: Renderer;
  private __program?: MusicProgram;
  private __programCue?: MusicProgram;
  private __programSwapTime: number;

  private __prevTime: number;

  private __bufferReaderNode?: BufferReaderNode;
  private __bufferWriteBlocks: number;

  private __samples: string[];

  public get time(): number {
    const t = BLOCK_SIZE / sampleRate * this.__bufferReadBlocks;
    return t - this.timeOffset;
  }

  public set time( value: number ) {
    const t = BLOCK_SIZE / sampleRate * this.__bufferWriteBlocks;
    this.timeOffset = t - value;
  }

  private get __bufferReadBlocks(): number {
    return this.__bufferReaderNode?.readBlocks ?? 0.0;
  }

  public constructor() {
    this.isPlaying = false;
    this.timeOffset = 0.0;
    this.deltaTime = 0.0;
    // this.__lastUpdatedTime = 0.0;
    this.__prevTime = 0.0;

    // -- shaderEventManager -----------------------------------------------------------------------
    this.shaderEventManager = new ShaderEventManager( ( code ) => this.compile( code ) );

    // -- audio ------------------------------------------------------------------------------------
    this.__musicDest = audio.createGain();
    this.__musicDest.connect( audio.destination );

    if ( import.meta.env.DEV ) {
      this.__musicDest.gain.value = 0.0;
      promiseGui.then( ( gui ) => {
        gui.button( 'audio/resume', { title: 'audio.resume();' } ).on( 'click', () => {
          audio.resume();
        } );

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
    this.__samples = [ 'noise', 'clapNoise', 'hihat' ];

    this.__renderer.uploadTexture( 'noise', sampleWhiteNoise );
    this.__renderer.uploadTexture( 'clapNoise', sampleClapNoise );
    this.__renderer.uploadTexture( 'hihat', sample808HiHat );
    this.__renderer.addTextureDirect( 'fbm', perlinFBMTextureTarget.texture );
  }

  /**
   * Compile given shader code and cue the shader.
   */
  public async compile( code: string ): Promise<void> {
    this.cueStatus = 'compiling';

    await this.__renderer.compile( code ).catch( ( e ) => {
      const error = this.__processErrorMessage( e );

      this.__programCue = undefined;

      this.cueStatus = 'none';

      // this.__emit( 'error', { error } );

      throw new Error( error ?? undefined );
    } );

    this.__programCue = {
      code,
    };

    this.cueStatus = 'applying';

    this.__programSwapTime = Math.floor( this.time / BAR ) * BAR + BAR;

    // this.__emit( 'error', { error: null } );
  }

  public async update(): Promise<void> {
    const readBlocks = this.__bufferReadBlocks;
    const now = readBlocks * BLOCK_SIZE / sampleRate;

    this.__bufferReaderNode?.setActive( this.isPlaying );

    this.shaderEventManager.update( now - this.timeOffset );

    if ( this.isPlaying ) {
      this.deltaTime = now - this.__prevTime;
    } else {
      this.deltaTime = 0.0;
    }

    this.__prevTime = now;

    // -- early abort? -----------------------------------------------------------------------------
    if ( !this.isPlaying ) { return; }

    // -- choose a right write block ---------------------------------------------------------------
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

    const genTime = BLOCK_SIZE * this.__bufferWriteBlocks / sampleRate - this.timeOffset;

    // -- should I process the next program? -------------------------------------------------------
    let beginNext = this.cueStatus === 'applying'
      ? Math.floor( ( this.__programSwapTime - genTime ) * sampleRate )
      : FRAMES_PER_RENDER;
    beginNext = Math.min( beginNext, FRAMES_PER_RENDER );

    // -- swap the program from first --------------------------------------------------------------
    if ( beginNext < 0 ) {
      this.cueStatus = 'none';

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
      this.cueStatus = 'none';

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
    this.__samples.map( ( sampleName ) => {
      this.__renderer.uniformTexture( 'sample_' + sampleName, sampleName, textureUnit );
      textureUnit ++;
    } );

    // TODO: this is terrible
    this.__renderer.uniformTexture( 'fbm', 'fbm', textureUnit );
    textureUnit ++;

    this.__renderer.uniform1f( 'bpm', MUSIC_BPM );
    this.__renderer.uniform1f( 'sampleRate', sampleRate );
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

  private __processErrorMessage( error: any ): string | null {
    const str: string | undefined = error?.message ?? error;
    if ( !str ) { return null; }

    return str.replace( /ERROR: (\d+):(\d+)/g, ( _match, ...args ) => {
      const line = parseInt( args[ 1 ] ) - shaderchunkPreLines + 1;
      return `ERROR: ${ args[ 0 ] }:${ line }`;
    } );
  }
}
