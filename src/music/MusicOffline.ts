import { AudioBufferPlayer } from './AudioBufferPlayer';
import { BAR, BLOCKS_PER_RENDER, BLOCK_SIZE, FRAMES_PER_RENDER, MUSIC_LENGTH } from './constants';
import { GLSLMusicEditor } from './GLSLMusicEditor';
import { GL_ARRAY_BUFFER } from '../gl/constants';
import { Music } from './Music';
import { arraySerial } from '@0b5vr/experimental';
import { audio, sampleRate } from '../globals/audio';
import { gl } from '../globals/canvas';
import { glslMusicEditor } from '../globals/glslMusicEditor';
import { musicCompile, musicRender, tfPool } from './Renderer';
import { musicRendererStatusObservers } from '../globals/globalObservers';
import { sleep } from '../utils/sleep';

export class MusicOffline extends AudioBufferPlayer implements Music {
  public deltaTime: number;
  public cueStatus: 'none' | 'compiling' | 'applying';
  public cueStatusRender: 'none' | 'compiling' | 'applying';

  private __prevTime: number;
  private __lastBar: number;

  public constructor() {
    super();

    this.deltaTime = 0.0;
    this.cueStatus = 'none';
    this.cueStatusRender = 'none';

    this.__prevTime = 0.0;
    this.__lastBar = 0;

    this.buffer = audio.createBuffer( 2, MUSIC_LENGTH * sampleRate, sampleRate );

    // -- status -----------------------------------------------------------------------------------
    musicRendererStatusObservers.push( ( status ) => this.cueStatusRender = status );

    glslMusicEditor.observersApply.push( () => {
      this.cueStatus = 'applying';
    } );

    // -- temp --
    this.prepare();
  }

  public async prepare(): Promise<void> {
    const glslMusicEditorForRender = new GLSLMusicEditor();

    glslMusicEditorForRender.observersApply.push( () => {
      const code = glslMusicEditorForRender.lines.join( '\n' );
      musicCompile( code );
    } );

    let block = 0;
    const blocksRequired = MUSIC_LENGTH * sampleRate / BLOCK_SIZE;

    while ( block < blocksRequired ) {
      const time = block * BLOCK_SIZE / sampleRate;

      // process 15 events at max
      arraySerial( 15 ).map( () => glslMusicEditorForRender.update( time ) );

      // -- wait until the shader compiles -------------------------------------------------------
      if ( this.cueStatusRender === 'compiling' ) {
        await sleep( 1 );
        continue;
      }

      // -- render -------------------------------------------------------------------------------
      const tfEntry = tfPool.next();

      musicRender( tfEntry, time );

      // -- read ---------------------------------------------------------------------------------
      gl.bindBuffer( GL_ARRAY_BUFFER, tfEntry.bufferL );
      gl.getBufferSubData(
        GL_ARRAY_BUFFER,
        0,
        this.buffer!.getChannelData( 0 ),
        block * BLOCK_SIZE,
        FRAMES_PER_RENDER,
      );

      gl.bindBuffer( GL_ARRAY_BUFFER, tfEntry.bufferR );
      gl.getBufferSubData(
        GL_ARRAY_BUFFER,
        0,
        this.buffer!.getChannelData( 1 ),
        block * BLOCK_SIZE,
        FRAMES_PER_RENDER,
      );

      block += BLOCKS_PER_RENDER;
    }
  }

  public update(): void {
    const now = audio.currentTime;

    // process 15 events at max
    arraySerial( 15 ).map( () => glslMusicEditor.update( this.time ) );

    if ( this.isPlaying ) {
      this.deltaTime = now - this.__prevTime;
    } else {
      this.deltaTime = 0.0;
    }

    const bar = ~~( this.time / BAR );
    if ( bar !== this.__lastBar ) {
      this.cueStatus = 'none';
    }
    this.__lastBar = bar;

    this.__prevTime = now;
  }
}
