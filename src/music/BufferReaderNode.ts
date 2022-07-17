import processorCode from './BufferReaderProcessor.js?raw';

const BLOCK_SIZE = 128;
const CHANNELS = 2;
const BUFFER_SIZE_PER_CHANNEL = 65536;

const processorBlob = new Blob( [ processorCode ], { type: 'text/javascript' } );
const processorUrl = URL.createObjectURL( processorBlob );

export class BufferReaderNode extends AudioWorkletNode {
  private __readBlocks: number;

  public get readBlocks(): number {
    return this.__readBlocks;
  }

  public static addModule( audio: AudioContext ): Promise<void> {
    return audio.audioWorklet.addModule( processorUrl );
  }

  public setActive( value: boolean ): void {
    this.port.postMessage( {
      type: 'active',
      value,
    } );
  }

  public constructor( audio: AudioContext ) {
    super( audio, 'buffer-reader-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [ CHANNELS ],
    } );

    this.__readBlocks = 0;

    this.port.onmessage = ( ( { data } ) => {
      this.__readBlocks = data;
    } );
  }

  public write( channel: number, block: number, offset: number, buffer: ArrayLike<number> ): void {
    const totalOffset = (
      BUFFER_SIZE_PER_CHANNEL * channel
      + ( BLOCK_SIZE * block ) % BUFFER_SIZE_PER_CHANNEL
      + offset
    );

    this.port.postMessage( {
      type: 'write',
      buffer,
      offset: totalOffset,
    } );
  }
}
