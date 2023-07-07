import { BAR, BEAT, FRAMES_PER_RENDER, MUSIC_BPM, SIXTEEN_BAR } from './constants';
import { GL_ARRAY_BUFFER, GL_FLOAT, GL_POINTS, GL_RASTERIZER_DISCARD, GL_STATIC_DRAW, GL_STREAM_READ, GL_TRANSFORM_FEEDBACK, GL_TRANSFORM_FEEDBACK_BUFFER } from '../gl/constants';
import { Pool, arraySerial, notifyObservers } from '@0b5vr/experimental';
import { gl } from '../globals/canvas';
import { glLazyProgram } from '../gl/glLazyProgram';
import { musicRendererStatusObservers } from '../globals/globalObservers';
import { sampleRate } from '../globals/audio';
import { shaderchunkPost, shaderchunkPre, shaderchunkPreLines } from './shaderchunks';

// == offset buffer ================================================================================
const offsetBuffer = gl.createBuffer();

gl.bindBuffer( GL_ARRAY_BUFFER, offsetBuffer );
gl.bufferData(
  GL_ARRAY_BUFFER,
  new Float32Array( arraySerial( FRAMES_PER_RENDER ) ),
  GL_STATIC_DRAW,
);
gl.bindBuffer( GL_ARRAY_BUFFER, null );

// == transform feedback pool ======================================================================
interface TFPoolEntry {
  bufferL: WebGLBuffer;
  bufferR: WebGLBuffer;
  tf: WebGLTransformFeedback;
}

export const tfPool = new Pool<TFPoolEntry>( arraySerial( 128 ).map( () => {
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

// == renderer =====================================================================================
let program: WebGLProgram | undefined;
let programCue: WebGLProgram | undefined;

export async function musicCompile( code: string ): Promise<void> {
  notifyObservers( musicRendererStatusObservers, 'compiling' );

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
      programCue = undefined;
      notifyObservers( musicRendererStatusObservers, 'none' );
      throw new Error( error ?? undefined );
    } );
  }

  programCue = await promiseProgramCue;
  notifyObservers( musicRendererStatusObservers, 'applying' );
}

function musicApplyCue(): void {
  program && gl.deleteProgram( program );
  program = programCue;
  programCue = undefined;
  notifyObservers( musicRendererStatusObservers, 'none' );
}

export function musicRender(
  tfEntry: TFPoolEntry,
  time: number,
): void {
  // -- should I process the next program? ---------------------------------------------------------
  const programSwapTime = ~~( time / BAR ) * BAR + BAR;

  let beginNext = programCue
    ? Math.min( ~~( ( programSwapTime - time ) * sampleRate ), FRAMES_PER_RENDER )
    : FRAMES_PER_RENDER;

  // -- swap the program from first --------------------------------------------------------------
  if ( beginNext < 0 ) {
    notifyObservers( musicRendererStatusObservers, 'none' );
    musicApplyCue();
    beginNext = FRAMES_PER_RENDER;
  }

  // -- render -----------------------------------------------------------------------------------
  musicRenderInternal( tfEntry, time, 0, beginNext );

  // render the next program from the mid of the code
  if ( beginNext < FRAMES_PER_RENDER ) {
    notifyObservers( musicRendererStatusObservers, 'none' );
    musicApplyCue();
    musicRenderInternal( tfEntry, time, beginNext, FRAMES_PER_RENDER - beginNext );
  }

}

function musicRenderInternal(
  tfEntry: TFPoolEntry,
  time: number,
  first: number,
  count: number,
): void {
  if ( program ) {
    gl.useProgram( program );

    // -- uniforms -------------------------------------------------------------------------------
    gl.uniform1f(
      gl.getUniformLocation( program, 'bpm' ),
      MUSIC_BPM,
    );
    gl.uniform1f(
      gl.getUniformLocation( program, 'sampleRate' ),
      sampleRate,
    );
    gl.uniform4f(
      gl.getUniformLocation( program, 'timeLength' ),
      BEAT,
      BAR,
      SIXTEEN_BAR,
      1E16
    );
    gl.uniform4f(
      gl.getUniformLocation( program, 'timeHead' ),
      time % BEAT,
      time % BAR,
      ( time - BAR ) % SIXTEEN_BAR,
      time
    );

    // -- attributes -----------------------------------------------------------------------------
    const attribLocation = gl.getAttribLocation( program, 'off' );

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
