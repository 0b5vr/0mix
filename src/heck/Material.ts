import { GLBlendFactor } from '../gl/GLBlendFactor';
import { GL_ONE, GL_TEXTURE0, GL_ZERO } from '../gl/constants';
import { Geometry } from './Geometry';
import { LazyProgramOptions, glLazyProgram } from '../gl/glLazyProgram';
import { RenderTarget } from './RenderTarget';
import { gl } from '../globals/canvas';
import { preparationTasks } from '../globals/preparationTasks';

export declare type MaterialUniformType = '1f' | '2f' | '3f' | '4f' | '1i' | '2i' | '3i' | '4i';
export declare type MaterialUniformVectorType = '1fv' | '2fv' | '3fv' | '4fv' | '1iv' | '2iv' | '3iv' | '4iv';
export declare type MaterialUniformMatrixVectorType = 'Matrix2fv' | 'Matrix3fv' | 'Matrix4fv';

export type MaterialTag =
  | 'deferred'
  | 'forward'
  | 'depth';

export type MaterialMap = { [ tag in MaterialTag ]?: Material };

export interface MaterialInitOptions {
  target: RenderTarget;
  geometry: Geometry;
}

export class Material {
  protected __linkOptions: LazyProgramOptions;

  private __initOptions: MaterialInitOptions;

  protected __uniforms: {
    [ name: string ]: {
      type: MaterialUniformType;
      value: number[];
    };
  } = {};

  protected __uniformVectors: {
    [ name: string ]: {
      type: MaterialUniformVectorType;
      value: Float32List | Int32List;
    };
  } = {};

  protected __uniformMatrixVectors: {
    [ name: string ]: {
      type: MaterialUniformMatrixVectorType;
      value: Float32List | Int32List;
      transpose?: boolean;
    };
  } = {};

  protected __uniformTextures: {
    [ name: string ]: {
      textures: WebGLTexture[];
      target: number;
    };
  } = {};

  private __vert: string;

  public get vert(): string {
    return this.__vert;
  }

  private __frag: string;

  public get frag(): string {
    return this.__frag;
  }

  private __program: WebGLProgram | undefined;

  public get program(): WebGLProgram | undefined {
    return this.__program;
  }

  public blend: [ GLBlendFactor, GLBlendFactor ];

  public offsetFactor: [ number, number ];

  /**
   * A handler which is called when the material is ready.
   */
  public onReady?: () => void;

  public constructor(
    vert: string,
    frag: string,
    { blend, offsetFactor, linkOptions, initOptions }: {
      initOptions: MaterialInitOptions,
      blend?: [ GLBlendFactor, GLBlendFactor ],
      offsetFactor?: [ number, number ],
      linkOptions?: LazyProgramOptions,
    },
  ) {
    this.__vert = vert;
    this.__frag = frag;
    this.__initOptions = initOptions;
    this.__linkOptions = linkOptions ?? {};
    this.blend = blend ?? [ GL_ONE, GL_ZERO ];
    this.offsetFactor = offsetFactor ?? [ 0, 0 ];

    if ( import.meta.env.DEV ) {
      this.compile();
    } else {
      preparationTasks.push( () => this.compile() );
    }
  }

  public addUniform( name: string, type: MaterialUniformType, ...value: number[] ): void {
    this.__uniforms[ name ] = { type, value };
  }

  public addUniformVector(
    name: string,
    type: MaterialUniformVectorType,
    value: Float32List | Int32List
  ): void {
    this.__uniformVectors[ name ] = { type, value };
  }

  public addUniformMatrixVector(
    name: string,
    type: MaterialUniformMatrixVectorType,
    value: Float32List | Int32List
  ): void {
    this.__uniformMatrixVectors[ name ] = { type, value };
  }

  public addUniformTextures( name: string, target: number, ...textures: WebGLTexture[] ): void {
    this.__uniformTextures[ name ] = { target, textures };
  }

  public setUniforms(): void {
    const program = this.__program;

    if ( !program ) { return; }

    Object.entries( this.__uniforms ).map( ( [ name, { type, value } ] ) => {
      const location = gl.getUniformLocation( program, name );
      if ( location != null ) {
        ( gl as any )[ 'uniform' + type ]( location, ...value );
      }
    } );

    Object.entries( this.__uniformVectors ).map( ( [ name, { type, value } ] ) => {
      const location = gl.getUniformLocation( program, name );
      if ( location != null ) {
        ( gl as any )[ 'uniform' + type ]( location, value );
      }
    } );

    Object.entries( this.__uniformMatrixVectors ).map(
      ( [ name, { type, value, transpose } ] ) => {
        const location = gl.getUniformLocation( program, name );
        if ( location != null ) {
          ( gl as any )[ 'uniform' + type ]( location, transpose, value );
        }
      }
    );

    let currentUnit = 0;
    Object.entries( this.__uniformTextures ).map( ( [ name, { target, textures } ] ) => {
      const location = gl.getUniformLocation( program, name );
      if ( location != null ) {
        textures.map( ( texture, i ) => {
          gl.activeTexture( GL_TEXTURE0 + currentUnit + i );
          gl.bindTexture( target, texture );
        } );

        gl.uniform1iv( location, textures.map( ( _, i ) => currentUnit + i ) );

        currentUnit += textures.length;
      }
    } );
  }

  public async compile(): Promise<void> {
    this.__program = await glLazyProgram(
      this.vert,
      this.frag,
      this.__linkOptions,
    ).catch( ( e ) => {
      if ( import.meta.env.DEV ) {
        console.error( this );
      }

      throw e;
    } );

    if ( import.meta.env.PROD ) {
      // draw once to actually compile the shader
      // See: https://scrapbox.io/0b5vr/WebGL:_%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%80%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%8C%E6%8F%8F%E7%94%BB%E9%96%8B%E5%A7%8B%E6%99%82%E3%81%AB%E7%99%BA%E7%94%9F%E3%81%97%E3%81%A6stall%E3%81%99%E3%82%8B
      gl.useProgram( this.__program );
      this.__initOptions!.target.bind();
      this.__initOptions!.geometry.drawElementsOrArrays();
    }

    this.onReady?.();
  }

  public setBlendMode(): void {
    gl.blendFunc( ...this.blend );
    gl.polygonOffset( ...this.offsetFactor );
  }

  public async replaceShader(
    vert?: string,
    frag?: string,
    options?: {
      defines?: string[],
      linkOptions?: LazyProgramOptions,
    },
  ): Promise<void> {
    const program = await glLazyProgram(
      vert ?? this.__vert,
      frag ?? this.__frag,
      options?.linkOptions,
    ).catch( ( e ) => {
      console.error( e );
    } );

    if ( program ) {
      vert && ( this.__vert = vert );
      frag && ( this.__frag = frag );

      if ( this.__program ) {
        gl.deleteProgram( this.__program );
      }

      this.__program = program;

      this.onReady?.();
    }
  }
}
